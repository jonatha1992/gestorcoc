from django.contrib import admin

from .models import ExternalPerson, Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "badge_number", "rank", "role", "is_active")
    list_filter = ("role", "rank", "is_active")
    search_fields = ("last_name", "first_name", "badge_number")


@admin.register(ExternalPerson)
class ExternalPersonAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "dni", "email", "function", "is_active")
    list_filter = ("is_active",)
    search_fields = ("last_name", "first_name", "dni", "email", "function")
