from django.urls import path

from .views import hash_tool

app_name = "utilities"

urlpatterns = [
    path("hashes/", hash_tool, name="hash_tool"),
]
