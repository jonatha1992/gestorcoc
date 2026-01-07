import hashlib

from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from core.permissions import permission_required
from .forms import HashForm


@login_required
@permission_required("utilities", "hash", redirect_to="/login/")
def hash_tool(request):
    result = None
    form = HashForm()

    if request.method == "POST":
        form = HashForm(request.POST, request.FILES)
        if form.is_valid():
            file_obj = form.cleaned_data["file"]
            md5_hash = hashlib.md5()
            sha256_hash = hashlib.sha256()
            for chunk in file_obj.chunks():
                md5_hash.update(chunk)
                sha256_hash.update(chunk)
            result = {
                "name": file_obj.name,
                "size": file_obj.size,
                "md5": md5_hash.hexdigest(),
                "sha256": sha256_hash.hexdigest(),
            }

    return render(request, "utilities/hash_tool.html", {"form": form, "result": result})
