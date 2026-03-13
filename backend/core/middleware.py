from django.utils.deprecation import MiddlewareMixin

from .audit import log_api_request


class AuditLogMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        request._audit_view_class = getattr(view_func, "cls", None)
        request._audit_view_kwargs = view_kwargs or {}
        return None

    def process_response(self, request, response):
        log_api_request(request, response)
        return response
