from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, NewPost, Post


def index(request):
    if request.method == "POST":
        print(request.POST)
        newPost = Post(text=request.POST["text"],
                       username=User.objects.get(username=request.POST["user"]))
        newPost.save()

    allPosts = Post.objects.all().order_by('-timestamp')
    return render(request, "network/index.html", {
        "newPostForm": NewPost,
        "allPosts": allPosts
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def profil(request, username):
    if request.method == "POST":
        if request.POST["action"] == "Follow" or request.POST["action"] == "Unfollow":
            user = User.objects.get(username=request.POST["user"])
            getFollowing = user.following[2:-2].split()
            print(getFollowing)
            if request.POST["action"] == "Follow":
                getFollowing.append(request.POST["follower"])
            else:
                getFollowing.remove(request.POST["follower"])

            user.following = str(getFollowing)
            user.save()

    user = User.objects.get(username=username)
    followerCount = len(user.follower[2:-2].split())
    followingCount = len(user.following[2:-2].split())
    userPosts = Post.objects.all().filter(username=user.id).order_by('-timestamp')

    if str(request.user) in user.following[2:-2].split():
        alreadyFollowing = True
    else:
        alreadyFollowing = False

    #print("len:", len(user.following[2:-2].split()), "list:", user.following[2:-2].split()[0])
    print(request.user)

    return render(request, "network/profil.html", {
        "user": user,
        "userPosts": userPosts,
        "followerCount": followerCount,
        "alreadyFollowing": alreadyFollowing,
        "followingCount": followingCount
    })
