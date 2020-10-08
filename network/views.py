import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.core.paginator import Paginator
import timeit
import time

from .models import User, NewPost, Post, Likes, Comments, Followings, Retweets


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
        "pageTitle": "All Posts",
        "view": "allposts",
        "allPosts": allPosts
    })


@ensure_csrf_cookie
def following(request):

    return render(request, "network/index.html", {
        "pageTitle": "Following",
        "view": "following"
    })


def profile(request, username):
    if request.method == "POST":
        data = json.loads(request.body)
        action = data["action"]
        username = data["username"]

        if action == "getprofile":
            try:
                getUser = User.objects.get(username=username)
            except:
                getUser = print("error")

            # Check if user is seeing his own profile
            if str(request.user) == str(username):
                ownProfile = True
            else:
                ownProfile = False

            try:
                getFollowings = Followings.objects.get(
                    user=User.objects.get(username=username)).follower
                if str(request.user.id) in (getFollowings).split(','):
                    alreadyFollowing = True
                else:
                    alreadyFollowing = False
            except:
                alreadyFollowing = False

            userProfile = {
                "name": str(getUser.first_name) + " " + str(getUser.last_name),
                "username": getUser.username,
                "followerCount": getUser.followerCount,
                "followingCount": getUser.followingCount,
                "ownProfile": ownProfile,
                "alreadyFollowing": alreadyFollowing
            }

            return JsonResponse(userProfile, safe=False)

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

    user = User.objects.get(username=username)

    try:
        getFollowings = Followings.objects.get(user=user).follower
        if str(request.user.id) in (getFollowings).split(','):
            alreadyFollowing = True
        else:
            alreadyFollowing = False
    except:
        alreadyFollowing = False

    # Check if user is seeing his own profile
    if str(request.user) == str(username):
        ownProfile = 1
    else:
        ownProfile = 0

    return render(request, "network/index.html", {
        "pageTitle": username,
        "view": "profile",
        "name": str(user.first_name) + " " + str(user.last_name),
        "alreadyFollowing": alreadyFollowing,
        "followerCount": user.followerCount,
        "followingCount": user.followingCount,
        "ownProfile": ownProfile
    })


@ ensure_csrf_cookie
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


@ ensure_csrf_cookie
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
    if request.method == "POST":
        # Benchmarking how long a it takes to load all posts
        start_time = timeit.default_timer()
        serializedPosts = []
        data = json.loads(request.body)
        currentFeedPage = data["currentFeedPage"]
        username = data["username"]

        if feed_view == "following":
            user = User.objects.get(username=request.user)
            followingList = (user.followingList).split(',')

            for user_id in followingList[:-1]:
                unserializedPosts = Post.objects.filter(
                    username_id=user_id).order_by('-timestamp')

        if feed_view == "profile":
            user = User.objects.get(username=username)
            unserializedPosts = Post.objects.filter(
                username=user.id).order_by('-timestamp')

        if feed_view == "allposts":
            unserializedPosts = Post.objects.all().order_by('-timestamp')

        # Show 10 contacts per page.
        paginator = Paginator(unserializedPosts, 10)

        if paginator.num_pages == currentFeedPage:
            lastFeedPage = True
        else:
            lastFeedPage = False

        unserializedPosts = paginator.page(currentFeedPage).object_list

        # Serialize each post and save them in list 'serializedPosts'
        for post in unserializedPosts:
            alreadyLiked = checkPastUserInteractionWithPost(
                request.user, post, "like")
            alreadyRetweeted = checkPastUserInteractionWithPost(
                request.user, post, "retweet")
            ownPost = checkIfOwnPost(request.user, post.username)

            serializedPosts.append(post.serialize(
                alreadyLiked, alreadyRetweeted, ownPost))

        feed = {
            "userLoggedIn": request.user.is_authenticated,
            "lastFeedPage": lastFeedPage,
            "posts": serializedPosts,
        }
        print("Loading", len(feed["posts"]), "Posts in:",
              str(round(timeit.default_timer() - start_time, 4)) + "s")
        return JsonResponse(feed, safe=False)


# Check if user interacted with this post in the past
def checkPastUserInteractionWithPost(username, post, interaction):

    if getattr(post, (interaction + "s")) > 0:
        if interaction == "like":
            interactionEntry = Likes.objects.get(post=post.id)

            # Check if already liked
            if str(username) in (interactionEntry.who_liked).split(','):
                userInteracted = True
            else:
                userInteracted = False

        if interaction == "retweet":
            interactionEntry = Retweets.objects.get(post=post.id)

            # Check if already retweeted
            if str(username) in (interactionEntry.who_retweeted).split(','):
                userInteracted = True
            else:
                userInteracted = False

    else:
        userInteracted = False

    return userInteracted


def checkIfOwnPost(loggedInUser, postCreator):
    if loggedInUser == postCreator:
        ownPost = True
    else:
        ownPost = False

    return ownPost


@ ensure_csrf_cookie
def post_action(request, post_id):
    if request.method == "POST":
        data = json.loads(request.body)
        action = data["action"]
        username = request.user
        post = Post.objects.get(id=post_id)

        if action == "like" or action == "unlike" or action == "retweet" or action == "unretweet":
            # Update likes counter
            if action == "like" or action == "retweet":
                if action == "like":
                    # updatedLikes = post.likes + 1
                    updatedCount = post.likes + 1
                    # Try to get the row with the likes
                    try:
                        getColumn = Likes.objects.get(
                            post=Post.objects.get(id=post_id))
                        updatedColumn = str(
                            getColumn.who_liked) + str(username) + ","
                        getColumn.who_liked = updatedColumn
                        getColumn.save()

                    except:
                        updatedColumn = Likes(post=Post.objects.get(
                            id=post.id), who_liked=(str(username) + ','))
                        updatedColumn.save()

                if action == "retweet":
                    updatedCount = post.retweets + 1

                    try:
                        getColumn = Retweets.objects.get(
                            post=Post.objects.get(id=post_id))
                        updatedColumn = str(
                            getColumn.who_retweeted) + str(username) + ","
                        getColumn.who_retweeted = updatedColumn
                        getColumn.save()

                    except:
                        updatedColumn = Retweets(post=Post.objects.get(
                            id=post.id), who_retweeted=(str(username) + ','))
                        updatedColumn.save()

            else:
                if action == "unlike":
                    updatedCount = post.likes - 1
                    getColumn = Likes.objects.get(
                        post=Post.objects.get(id=post_id))
                    getUser = str(getColumn.who_liked)

                if action == "unretweet":
                    updatedCount = post.retweets - 1
                    getColumn = Retweets.objects.get(
                        post=Post.objects.get(id=post_id))
                    getUser = str(getColumn.who_retweeted)

                getUser = getUser.split(',')
                getUser.remove(str(username))
                updatedColumn = str(getUser).translate(str.maketrans(
                    {"'": "", "[": "", "]": "", " ": ""}))

                if action == "unlike":
                    getColumn.who_liked = updatedColumn
                    getColumn.save()
                if action == "unretweet":
                    getColumn.who_retweeted = updatedColumn
                    getColumn.save()

            if action == "like" or action == "unlike":
                post.likes = updatedCount
            if action == "retweet" or action == "unretweet":
                post.retweets = updatedCount

            post.save()

        if action == "comment":
            pass

        if action == "edit":
            pass

        return JsonResponse({
            "status": "success"
        })
