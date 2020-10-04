import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from .models import User, NewPost, Post, Likes, Comments


# @csrf_exempt
@ensure_csrf_cookie
def index(request):
    if request.method == "POST":
        data = json.loads(request.body)
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
    if feed_view == "allposts":
        posts = Post.objects.all()
        lst = []

        # Check if current user already liked the post
        for post in posts:
            if post.likes > 0:
                likedEntry = Likes.objects.get(post=post.id)
                # Check if already liked
                if str(request.user) in (likedEntry.who_liked).split(','):
                    alreadyLiked = True
                    print("TRIGGERED AT:", post)

                else:
                    alreadyLiked = False

                print(likedEntry.who_liked)

            else:
                alreadyLiked = False

            lst.insert(0, post.serialize(alreadyLiked))

    if feed_view == "followingposts":
        getUser = User.objects.get(username=request.user)
        # getFollowingIDs = User.objects.
        # createFollowingList = getUser.following[:-1]
        #feed = Post.objects.filter(username__in=(getUser.following[:-1]))
        # print(getFollowingList)

    if feed_view == "profil":
        data = json.loads(request.body)
        username = data["username"]
        user = User.objects.get(username=username)
        posts = Post.objects.all().filter(username=user.id)

    alreadyLiked = False
    posts = posts.order_by("-timestamp").all()
    return JsonResponse(lst, safe=False)


def profil(request, username):
    if request.method == "POST":
        data = json.loads(request.body)
        action = data["action"]
        username = data["username"]
        print("a:", action, "u:", username)

        if action == "getProfil":
            user = User.objects.get(username=username)

            # Get follower and following count
            if user.follower == "":
                followerCount = 0
            else:
                followerCount = len((user.follower)[:-1].split(','))

            if user.following == "":
                followingCount = 0
            else:
                followingCount = len((user.following)[:-1].split(','))

            # Check if already following
            if str(request.user) in (user.follower).split(','):
                alreadyFollowing = "true"
            else:
                alreadyFollowing = "false"

            # Check if user is seeing his own profile
            if str(request.user) == str(username):
                ownProfil = "true"
            else:
                ownProfil = "false"

            print(ownProfil)

            return JsonResponse({
                "name": str(user.first_name) + " " + str(user.last_name),
                "alreadyFollowing": alreadyFollowing,
                "followerCount": followerCount,
                "followingCount": followingCount,
                "ownProfil": ownProfil
            })

        if action == "follow" or action == "unfollow":
            user = User.objects.get(username=username)
            getFollower = str(user.follower)

            if action == "follow":
                updatedFollower = getFollower + str(request.user) + ","
            else:
                getFollower = getFollower.split(',')
                getFollower.remove(str(request.user))
                updatedFollower = str(getFollower).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

                print(updatedFollower)
                print(str(getFollower).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""})))

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

    # Check if already following
    if str(request.user) in (user.follower).split(','):
        alreadyFollowing = True
    else:
        alreadyFollowing = False

    return render(request, "network/profil.html", {
        "user": user,
        "alreadyFollowing": alreadyFollowing,
        "followerCount": followerCount,
        "followingCount": followingCount
    })


def post_action(request, post_id):
    if request.method == "POST":
        data = json.loads(request.body)
        print("DATA:", data)
        action = data["action"]
        username = request.user
        post = Post.objects.get(id=post_id)

        if action == "like" or action == "unlike":
            # Update likes counter
            if action == "like":
                updatedLikes = post.likes + 1

                # Try to get the row with the likes likes
                try:
                    getLikeColumn = Likes.objects.get(
                        post=Post.objects.get(id=post_id))
                    updatedColumn = str(
                        getLikeColumn.who_liked) + str(username) + ","
                    getLikeColumn.who_liked = updatedColumn
                    getLikeColumn.save()

                except:
                    updatedColumn = Likes(post=Post.objects.get(
                        id=post.id), who_liked=(str(username) + ','))
                    updatedColumn.save()

                print("getLikeTableColumn: SUCCESS")
            else:
                updatedLikes = post.likes - 1
                getlikeColumn = Likes.objects.get(
                    post=Post.objects.get(id=post_id))
                print("getLikeTableColumn: FAILED")

                getLiker = str(getlikeColumn.who_liked)
                getLiker = getLiker.split(',')
                getLiker.remove(str(username))
                updatedColumn = str(getLiker).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

                getlikeColumn.who_liked = updatedColumn
                getlikeColumn.save()

            post.likes = updatedLikes
            post.save()

        if action == "comment":
            pass

        if action == "edit":
            pass

        return JsonResponse({
            "status": "success"
        })
