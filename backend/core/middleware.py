from django.utils.deprecation import MiddlewareMixin

from .audit import log_api_request, capture_delete_target


class AuditLogMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        request._audit_view_class = getattr(view_func, "cls", None)
        request._audit_view_kwargs = view_kwargs or {}
        
        # Capturar información del objeto antes de eliminarlo
        if (request.method or "").upper() == "DELETE":
            capture_delete_target(request, view_kwargs)
        
        return None

    def process_response(self, request, response):
        log_api_request(request, response)
        return response
