from django.contrib import admin
from .models import Person

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'badge_number', 'role', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('last_name', 'badge_number')
