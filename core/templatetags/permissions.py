from django import template

from core.permissions import user_has_permission

register = template.Library()


@register.simple_tag(takes_context=True)
def has_permission(context, module: str, action: str) -> bool:
    request = context.get("request")
    if not request:
        return False
    return user_has_permission(request.user, module, action)
