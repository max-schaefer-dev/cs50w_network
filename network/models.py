from django.contrib.auth.models import AbstractUser
from django.db import models
from django import forms


class User(AbstractUser):
    followingList = models.TextField(default="")
    followingCount = models.IntegerField(default=0)
    followerCount = models.IntegerField(default=0)


class Followings(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="followedUser")
    follower = models.TextField(default="")


class NewPost(forms.Form):
    text = forms.CharField(widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
                           label='New Post', max_length=280)


class Post(models.Model):
    text = models.CharField(max_length=280)
    username = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="postBy")
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)

    def __str__(self):
        return f"User: {self.username}, Post: {self.text}"

    def serialize(self, alreadyLiked, ownPost):
        return {
            "id": self.id,
            "username": self.username.username,
            "text": self.text,
            "likes": self.likes,
            "comments": self.comments,
            "alreadyLiked": alreadyLiked,
            "ownPost": ownPost,
            "timestamp": self.timestamp.strftime("%Y-%d-%m, %H:%M:%S")
        }


class Likes(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="postLikedBy")
    who_liked = models.TextField(default="")

    def __str__(self):
        return f"Post: {self.post}, Likers: {self.who_liked}"


class Comments(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="postCommentedBy")
    comments = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="postComments")
    who_commented = models.TextField(default="")

    def __str__(self):
        return f"Post: {self.post}, Comments: {self.comments}, Commentators: {self.who_commented}"
