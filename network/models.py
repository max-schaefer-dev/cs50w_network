from django.contrib.auth.models import AbstractUser
from django.db import models
from django import forms


class User(AbstractUser):
    pass


class NewPost(forms.Form):
    text = forms.CharField(widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
                           label='New Post', max_length=280)


class Post(models.Model):
    text = models.CharField(max_length=280)
    username = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="postBy")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"User: {self.username} postet: {self.text}"
