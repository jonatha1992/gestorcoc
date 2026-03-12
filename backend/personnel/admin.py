from django.contrib import admin

from .models import ExternalPerson, Person, UserAccountProfile


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "badge_number", "rank", "role", "user", "is_active")
    list_filter = ("role", "rank", "is_active")
    search_fields = ("last_name", "first_name", "badge_number", "user__username")


@admin.register(ExternalPerson)
class ExternalPersonAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "dni", "email", "function", "is_active")
    list_filter = ("is_active",)
    search_fields = ("last_name", "first_name", "dni", "email", "function")


@admin.register(UserAccountProfile)
class UserAccountProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "must_change_password", "created_at", "updated_at")
    list_filter = ("must_change_password",)
    search_fields = ("user__username", "user__first_name", "user__last_name")
