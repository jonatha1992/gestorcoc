from django import forms

from core.forms import TailwindFormMixin


class HashForm(TailwindFormMixin, forms.Form):
    file = forms.FileField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_base_classes()
