import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from .models import User, NewPost, Post, Likes, Comments, Followings


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
    pageTitle = "allposts"
    return render(request, "network/index.html", {
        "newPostForm": NewPost,
        "pageTitle": pageTitle,
        "allPosts": allPosts
    })


@ensure_csrf_cookie
def following(request):
    pageTitle = "following"

    return render(request, "network/index.html", {
        "pageTitle": pageTitle
    })


@ensure_csrf_cookie
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


@ensure_csrf_cookie
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
            alreadyLiked = checkIfLiked(request.user, post)
            ownPost = checkIfOwnPost(request.user, post.username)

            lst.insert(0, post.serialize(alreadyLiked, ownPost))

    if feed_view == "following":
        user = User.objects.get(username=request.user)
        followingList = (user.followingList).split(',')
        lst = []

        for user_id in followingList[:-1]:
            posts = Post.objects.filter(username_id=user_id)

            for post in posts:
                alreadyLiked = checkIfLiked(request.user, post)
                ownPost = checkIfOwnPost(request.user, post.username)

                lst.insert(0, post.serialize(alreadyLiked, ownPost))

    if feed_view == "profil":
        data = json.loads(request.body)
        username = data["username"]
        user = User.objects.get(username=username)
        posts = Post.objects.filter(username=user.id)
        lst = []
        dct = {}

        for post in posts:
            alreadyLiked = checkIfLiked(request.user, post)
            ownPost = checkIfOwnPost(request.user, post.username)

            lst.insert(0, post.serialize(alreadyLiked, ownPost))

    dct = {
        "userLoggedIn": request.user.is_authenticated,
        "posts": lst,
    }

    return JsonResponse(dct, safe=False)


def checkIfLiked(username, post):
    if post.likes > 0:
        likedEntry = Likes.objects.get(post=post.id)
        # Check if already liked
        if str(username) in (likedEntry.who_liked).split(','):
            alreadyLiked = True

        else:
            alreadyLiked = False

    else:
        alreadyLiked = False

    return alreadyLiked


def checkIfOwnPost(loggedInUser, postCreator):
    if loggedInUser == postCreator:
        ownPost = True
    else:
        ownPost = False

    return ownPost


def profil(request, username):
    if request.method == "POST":
        data = json.loads(request.body)
        action = data["action"]
        username = data["username"]
        print("a:", action, "u:", username)

        if action == "getProfil":
            user = User.objects.get(username=username)

            try:
                getFollowings = Followings.objects.get(user=user).follower
                if str(request.user.id) in (getFollowings).split(','):
                    alreadyFollowing = "true"
                else:
                    alreadyFollowing = "false"
            except:
                alreadyFollowing = "false"

            # Check if user is seeing his own profile
            if str(request.user) == str(username):
                ownProfil = "true"
            else:
                ownProfil = "false"

            return JsonResponse({
                "name": str(user.first_name) + " " + str(user.last_name),
                "alreadyFollowing": alreadyFollowing,
                "followerCount": user.followerCount,
                "followingCount": user.followingCount,
                "ownProfil": ownProfil
            })

        if action == "follow" or action == "unfollow":
            user = User.objects.get(username=username)
            follower = User.objects.get(username=request.user)

            # Get table with the users followers
            try:
                followingTableEntry = Followings.objects.get(user=user)
            except:
                followingTableEntry = Followings(user=user, follower="")

            followingTableList = str(followingTableEntry.follower)

            if action == "follow":
                # Update info for user who is being followed
                user.followerCount += 1
                updatedFollower = followingTableList + \
                    str(request.user.id) + ","

                # Update info for the user who is now following
                updatedFollowingUser = str(
                    follower.followingList) + str(user.id) + ","

            else:
                # Update info for user who is being followed
                user.followerCount -= 1
                followingTableList = followingTableList.split(',')
                followingTableList.remove(str(request.user.id))
                updatedFollower = str(followingTableList).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

                # Update info for the user who is now following
                updatedFollowingUser = User.objects.get(
                    username=request.user).followingList
                updatedFollowingUser = updatedFollowingUser.split(',')
                updatedFollowingUser.remove(str(user.id))
                updatedFollowingUser = str(updatedFollowingUser).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

            followingTableEntry.follower = updatedFollower
            follower.followingList = updatedFollowingUser

            followingTableEntry.save()
            follower.save()
            user.save()

    return render(request, "network/profil.html")


@ensure_csrf_cookie
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
