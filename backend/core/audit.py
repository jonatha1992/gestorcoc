from __future__ import annotations

import json
from collections.abc import Mapping
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.db import models
from django.db.utils import OperationalError, ProgrammingError
from django.http import HttpRequest
from django.utils.encoding import force_str

from personnel.access import get_user_role

from .models import AuditLog


User = get_user_model()

SENSITIVE_KEYS = {
    "password",
    "old_password",
    "new_password",
    "new_password_confirm",
    "access",
    "refresh",
    "token",
    "authorization",
    "api_key",
    "secret",
}
SUMMARY_LIST_KEYS = {"frames", "entries", "results"}
EXCLUDED_PATH_PREFIXES = (
    "/api/health/",
    "/api/schema/",
    "/swagger/",
)
SPECIAL_ACTION_BY_PATH = {
    "/api/auth/login/": "login",
    "/api/auth/logout/": "logout",
    "/api/auth/refresh/": "refresh_token",
    "/api/auth/change-password/": "change_password",
    "/api/auth/me/": "read_session",
    "/api/integrity-check/": "generate_integrity_report",
    "/api/integrity-summary-report/": "generate_integrity_summary",
    "/api/video-analysis-report/": "generate_video_analysis_report",
    "/api/video-analysis-improve-text/": "improve_video_analysis_text",
}
ACTION_BY_METHOD = {
    "GET": "read",
    "HEAD": "read",
    "OPTIONS": "read",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}


def set_audit_context(request: HttpRequest, **kwargs):
    current = getattr(request, "_audit_context", {}) or {}

    current_metadata = current.get("metadata") or {}
    incoming_metadata = kwargs.pop("metadata", None) or {}
    if current_metadata or incoming_metadata:
        current["metadata"] = {**current_metadata, **incoming_metadata}

    current_changes = current.get("changes") or {}
    incoming_changes = kwargs.pop("changes", None) or {}
    if current_changes or incoming_changes:
        current["changes"] = {**current_changes, **incoming_changes}

    for key, value in kwargs.items():
        if value is not None:
            current[key] = value

    request._audit_context = current


def get_audit_context(request: HttpRequest) -> dict[str, Any]:
    return getattr(request, "_audit_context", {}) or {}


def skip_audit_logging(request: HttpRequest):
    request._audit_skip_logging = True


def should_log_request(request: HttpRequest) -> bool:
    path = request.path or ""
    if getattr(request, "_audit_skip_logging", False):
        return False
    if not path.startswith("/api/"):
        return False
    return not any(path.startswith(prefix) for prefix in EXCLUDED_PATH_PREFIXES)


def log_api_request(request: HttpRequest, response) -> None:
    if not should_log_request(request):
        return

    try:
        context = get_audit_context(request)
        action = context.get("action") or infer_action(request)
        actor = resolve_actor(request, response, context)
        username = context.get("username") or resolve_username(request, response, actor)
        role = context.get("role") or (get_user_role(actor) if actor is not None else "")
        target = resolve_target(request, response, context)
        message = context.get("message") or build_default_message(action, target, response.status_code)

        method = (request.method or "").upper()
        metadata = {
            "query_params": extract_query_params(request),
            "request_payload": extract_request_payload(request),
            "response_payload": extract_response_payload(
                response,
                condensed=method in {"GET", "HEAD", "OPTIONS"} and getattr(response, "status_code", 0) < 400,
            ),
        }
        metadata.update(sanitize_value(context.get("metadata") or {}))
        metadata = {key: value for key, value in metadata.items() if value not in ({}, [], "", None)}

        AuditLog.objects.create(
            actor=actor,
            username=username,
            role=role or "",
            action=action,
            method=(request.method or "").upper(),
            status_code=getattr(response, "status_code", 0) or 0,
            path=(request.path or "")[:255],
            route_name=(get_route_name(request) or "")[:255],
            ip_address=(context.get("ip_address") or get_client_ip(request) or None),
            user_agent=(request.META.get("HTTP_USER_AGENT", "") or "")[:255],
            target_app=target["app"],
            target_model=target["model"],
            target_id=target["id"],
            target_repr=target["repr"],
            message=message[:255],
            changes=sanitize_value(context.get("changes") or {}),
            metadata=metadata,
        )
    except (OperationalError, ProgrammingError):
        return


def infer_action(request: HttpRequest) -> str:
    path = request.path or ""
    if path in SPECIAL_ACTION_BY_PATH:
        return SPECIAL_ACTION_BY_PATH[path]
    if path.endswith("/verify_by_crev/"):
        return "verify_by_crev"
    if path.endswith("/save_report_draft/"):
        return "save_report_draft"
    return ACTION_BY_METHOD.get((request.method or "").upper(), "request")


def resolve_actor(request: HttpRequest, response, context: dict[str, Any]):
    actor = context.get("actor")
    if actor is not None:
        return actor

    user = getattr(request, "user", None)
    if getattr(user, "is_authenticated", False):
        return user

    if infer_action(request) == "login":
        response_data = getattr(response, "data", None) or {}
        user_payload = response_data.get("user") if isinstance(response_data, Mapping) else None
        user_id = user_payload.get("user_id") if isinstance(user_payload, Mapping) else None
        if user_id:
            return User.objects.filter(id=user_id).first()
    return None


def resolve_username(request: HttpRequest, response, actor) -> str:
    if actor is not None:
        return actor.username

    response_data = getattr(response, "data", None)
    if isinstance(response_data, Mapping):
        user_payload = response_data.get("user")
        if isinstance(user_payload, Mapping) and user_payload.get("username"):
            return str(user_payload["username"])

    payload = extract_request_payload(request)
    username = payload.get("username") if isinstance(payload, Mapping) else None
    return force_str(username)[:150] if username else ""


def resolve_target(request: HttpRequest, response, context: dict[str, Any]) -> dict[str, str]:
    target = context.get("target") or {}
    if target:
        return {
            "app": force_str(target.get("app", ""))[:100],
            "model": force_str(target.get("model", ""))[:100],
            "id": force_str(target.get("id", ""))[:64],
            "repr": force_str(target.get("repr", ""))[:255],
        }

    model = infer_view_model(request)
    target_id = infer_target_id(request, response)
    target_repr = ""
    app_label = ""
    model_name = ""

    if model is not None:
        app_label = model._meta.app_label
        model_name = model._meta.model_name
        # Para DELETE, intentamos obtener la instancia si no fue capturada antes
        # (fallback por si el middleware no la capturó)
        if target_id:
            method = (request.method or "").upper()
            if method != "DELETE":
                instance = model._default_manager.filter(pk=target_id).first()
                if instance is not None:
                    target_repr = force_str(instance)
            else:
                # En DELETE, la instancia ya fue eliminada, pero deberíamos tener
                # la información capturada en el contexto por el middleware
                # Si no, dejamos target_repr vacío
                pass

    return {
        "app": app_label[:100],
        "model": model_name[:100],
        "id": force_str(target_id)[:64] if target_id is not None else "",
        "repr": target_repr[:255],
    }


def infer_target_id(request: HttpRequest, response) -> Any:
    kwargs = getattr(request, "_audit_view_kwargs", {}) or {}
    if kwargs.get("pk") is not None:
        return kwargs["pk"]

    response_data = getattr(response, "data", None)
    if isinstance(response_data, Mapping):
        if response_data.get("id") is not None:
            return response_data["id"]
        nested = response_data.get("record")
        if isinstance(nested, Mapping) and nested.get("id") is not None:
            return nested["id"]
    return None


def infer_view_model(request: HttpRequest):
    view_class = getattr(request, "_audit_view_class", None)
    if view_class is None:
        return None

    queryset = getattr(view_class, "queryset", None)
    if queryset is not None and hasattr(queryset, "model"):
        return queryset.model

    serializer_class = getattr(view_class, "serializer_class", None)
    meta = getattr(serializer_class, "Meta", None)
    model = getattr(meta, "model", None)
    return model


def get_route_name(request: HttpRequest) -> str:
    resolver_match = getattr(request, "resolver_match", None)
    if resolver_match is None:
        return ""
    return resolver_match.view_name or resolver_match.url_name or ""


def build_default_message(action: str, target: dict[str, str], status_code: int) -> str:
    target_label = target["repr"] or target["model"] or "recurso"
    if status_code >= 400:
        return f"{action} fallido sobre {target_label}"
    return f"{action} ejecutado sobre {target_label}"


def extract_query_params(request: HttpRequest) -> dict[str, Any]:
    query_dict = getattr(request, "GET", None)
    if not query_dict:
        return {}
    return sanitize_value(
        {key: query_dict.getlist(key) if len(query_dict.getlist(key)) > 1 else query_dict.get(key) for key in query_dict}
    )


def extract_request_payload(request: HttpRequest) -> dict[str, Any]:
    method = (request.method or "").upper()
    if method in {"GET", "HEAD", "OPTIONS"}:
        return {}

    content_type = (request.META.get("CONTENT_TYPE", "") or "").lower()
    try:
        if "multipart/form-data" in content_type:
            payload = {
                key: request.POST.getlist(key) if len(request.POST.getlist(key)) > 1 else request.POST.get(key)
                for key in request.POST
            }
            if request.FILES:
                payload["files"] = {
                    key: [
                        {
                            "name": uploaded_file.name,
                            "size": uploaded_file.size,
                            "content_type": getattr(uploaded_file, "content_type", ""),
                        }
                        for uploaded_file in request.FILES.getlist(key)
                    ]
                    for key in request.FILES
                }
            return sanitize_value(payload)

        if "application/json" in content_type:
            raw_body = request.body.decode(request.encoding or "utf-8") if request.body else ""
            return sanitize_value(json.loads(raw_body)) if raw_body else {}

        if request.POST:
            return sanitize_value(
                {
                    key: request.POST.getlist(key) if len(request.POST.getlist(key)) > 1 else request.POST.get(key)
                    for key in request.POST
                }
            )
    except Exception as exc:
        return {"_unavailable": force_str(exc)[:200]}
    return {}


def extract_response_payload(response, *, condensed: bool = False) -> dict[str, Any]:
    if getattr(response, "streaming", False):
        content_disposition = response.headers.get("Content-Disposition", "")
        return sanitize_value({"streaming": True, "content_disposition": content_disposition})

    data = getattr(response, "data", None)
    if data is None:
        return {}
    if condensed:
        if isinstance(data, list):
            return {"result_count": len(data)}
        if isinstance(data, Mapping):
            results = data.get("results")
            if isinstance(results, list):
                return {"keys": list(data.keys())[:10], "result_count": len(results)}
            reduced = {}
            for key in ("id", "detail", "message", "count"):
                if key in data:
                    reduced[key] = data[key]
            return sanitize_value(reduced or {"keys": list(data.keys())[:10]})
    return sanitize_value(data)


def sanitize_value(value: Any, depth: int = 0) -> Any:
    if depth > 4:
        return "[max-depth]"

    if isinstance(value, Mapping):
        sanitized = {}
        items = list(value.items())
        for key, item_value in items[:40]:
            normalized_key = force_str(key).lower()
            if any(token in normalized_key for token in SENSITIVE_KEYS):
                sanitized[force_str(key)] = "***"
                continue
            if normalized_key in SUMMARY_LIST_KEYS and isinstance(item_value, (list, tuple, set)):
                sanitized[force_str(key)] = {"count": len(item_value)}
                continue
            sanitized[force_str(key)] = sanitize_value(item_value, depth + 1)
        if len(items) > 40:
            sanitized["__truncated_items__"] = len(items) - 40
        return sanitized

    if isinstance(value, (list, tuple, set)):
        sequence = list(value)
        sanitized = [sanitize_value(item, depth + 1) for item in sequence[:10]]
        if len(sequence) > 10:
            sanitized.append(f"... {len(sequence) - 10} items more")
        return sanitized

    if hasattr(value, "name") and hasattr(value, "size"):
        return {
            "name": getattr(value, "name", ""),
            "size": getattr(value, "size", 0),
            "content_type": getattr(value, "content_type", ""),
        }

    if isinstance(value, (datetime, date, time)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, bytes):
        return f"<bytes:{len(value)}>"

    if isinstance(value, str):
        return value if len(value) <= 500 else f"{value[:500]}... [truncated]"

    if isinstance(value, models.Model):
        return force_str(value)

    if value is None or isinstance(value, (bool, int, float)):
        return value

    return force_str(value)[:250]


def get_client_ip(request: HttpRequest) -> str:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def capture_delete_target(request: HttpRequest, view_kwargs: dict[str, Any]) -> None:
    """
    Captura la información del objeto que se va a eliminar ANTES de que sea borrado.
    Esto permite registrar el nombre completo (target_repr) en el log de auditoría.
    """
    pk = view_kwargs.get("pk")
    if not pk:
        return

    model = infer_view_model(request)
    if model is None:
        return

    try:
        instance = model._default_manager.filter(pk=pk).first()
        if instance is not None:
            target_context = {
                "target": {
                    "app": model._meta.app_label,
                    "model": model._meta.model_name,
                    "id": str(pk),
                    "repr": force_str(instance),
                }
            }
            existing_context = getattr(request, "_audit_context", {}) or {}
            request._audit_context = {**existing_context, **target_context}
    except Exception:
        pass
