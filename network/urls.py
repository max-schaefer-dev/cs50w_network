
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("following", views.following, name="following"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # APIs
    # path("<str:username>", views.profil, name="profil"),
    path("<str:username>", views.profil, name="profil"),
    path("feed/<str:feed_view>", views.feed, name="feed"),
    path("post/<int:post_id>", views.post_action, name="post_action")
