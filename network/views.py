import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from .models import User, NewPost, Post


# @csrf_exempt
@ensure_csrf_cookie
def index(request):
    if request.method == "POST":
        data = json.loads(request.body)
        print(data)
        postContent = data["text"]
        username = request.user

        newPost = Post(text=postContent,
                       username=User.objects.get(username=username))
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


def feed(request, feed_view):
    print(request.user)

    if feed_view == "allposts":
        posts = Post.objects.all()

    if feed_view == "followingposts":
        getUser = User.objects.get(username=request.user)
        # getFollowingIDs = User.objects.
        # createFollowingList = getUser.following[:-1]
        feed = Post.objects.filter(username__in=(getUser.following[:-1]))
        print(getFollowingList)

        # posts = Post.objects.filter()
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([post.serialize() for post in posts], safe=False)


def profil(request, username):
    if request.method == "POST":
        if request.POST["action"] == "Follow" or request.POST["action"] == "Unfollow":
            user = User.objects.get(username=request.POST["user"])
            getFollower = str(user.follower)
            # print(getFollowing)

            if request.POST["action"] == "Follow":
                updatedFollower = getFollower + \
                    str(request.POST["follower"]) + ","
                # getFollowing.append(request.POST["follower"])
            else:
                # getFollowing.remove(request.POST["follower"])
                getFollower = getFollower.split(',')
                getFollower.remove(str(request.POST["follower"]))
                updatedFollower = str(getFollower).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

                print(updatedFollower)
                print(str(getFollower).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""})))

            # user.following = str(getFollowing).strip('][')
            user.follower = updatedFollower
            user.save()

    user = User.objects.get(username=username)
    if user.follower == "":
        followerCount = 0
    else:
        followerCount = len((user.follower)[:-1].split(','))

    if user.following == "":
        followingCount = 0
    else:
        followingCount = len((user.following)[:-1].split(','))

    userPosts = Post.objects.all().filter(username=user.id).order_by('-timestamp')
    # t = (User.objects.get(username="tom").following).split(',')
    # test = Post.objects.filter(username__in=(2, 1))
    # print(tt)
    # print(str(tt).translate(str.maketrans(
    #    {"'": "", "[": "", "]": "", " ": ""})))
    # print((user.follower).split(','))
    # print(user.follower.replace("max", ""))

    # Check if already following
    if str(request.user) in (user.follower).split(','):
        alreadyFollowing = True
    else:
        alreadyFollowing = False

    return render(request, "network/profil.html", {
        "user": user,
        "userPosts": userPosts,
        "alreadyFollowing": alreadyFollowing,
        "followerCount": followerCount,
        "followingCount": followingCount
    })
