from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .access import assign_role_group, ensure_role_groups
from .models import Person, UserAccountProfile


User = get_user_model()


@receiver(post_migrate)
def sync_role_groups_after_migrate(sender, app_config, **kwargs):
    if app_config.label != "personnel":
        return
    ensure_role_groups()


@receiver(post_save, sender=User)
def ensure_account_profile(sender, instance, created, **kwargs):
    if created:
        UserAccountProfile.objects.get_or_create(user=instance)

    person = getattr(instance, "person", None)
    if person is not None:
        assign_role_group(instance, person.role)


@receiver(post_save, sender=Person)
def sync_linked_user(sender, instance, **kwargs):
    user = instance.user
    if user is None:
        return

    changed_fields = []
    if user.first_name != instance.first_name:
        user.first_name = instance.first_name
        changed_fields.append("first_name")
    if user.last_name != instance.last_name:
        user.last_name = instance.last_name
        changed_fields.append("last_name")
    if changed_fields:
        user.save(update_fields=changed_fields)

    UserAccountProfile.objects.get_or_create(user=user)
    assign_role_group(user, instance.role)
