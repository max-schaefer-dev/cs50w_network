class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: [],
            userLoggedIn: false,
            view: document.querySelector('#main').getAttribute(['data-vw']),
            pageTitle: document.getElementById('main').getAttribute(['data-pn']),
            csrftoken: this.getCookie('csrftoken'),
            currentFeedPage: 1,
            lastFeedPage: false
        };
        this.handleSubmit = this.handleSubmit.bind(this)
        this.getCookie = this.getCookie.bind(this)
        this.paginatorSubmit = this.paginatorSubmit.bind(this)
        this.updatePaginatorButtons = this.updatePaginatorButtons.bind(this)
    }

    render() {
        return (
            <MainTable view={this.state.view} pageTitle={this.state.pageTitle} currentFeedPage={this.state.currentFeedPage} lastFeedPage={this.state.lastFeedPage} posts={this.state.posts} paginatorSubmit={this.paginatorSubmit} getCookie={this.getCookie} />
        );
    }

    componentDidMount() {
        fetch(`/feed/${this.state.view}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                username: document.getElementById('page-title').innerHTML,
                currentFeedPage: this.state.currentFeedPage
            })
        })
            .then(response => response.json())
            .then(result => {
                this.setState({
                    posts: result["posts"],
                    userLoggedIn: result["userLoggedIn"],
                    lastFeedPage: result["lastFeedPage"]
                });
            })

        setTimeout(() => {
            if (this.state.view == "allposts") {
                if (this.state.userLoggedIn) {
                    document.getElementById('submitPost').addEventListener('click', () => this.handleSubmit());
                    let postInput = document.getElementById('postInput')
                    postInput.addEventListener('keyup', () => {
                        if (postInput.value.length > 0) {
                            document.getElementById('charCountControl').classList.add('vis')
                            document.getElementById('submitPost').removeAttribute('disabled');
                        }
                        else {
                            document.getElementById('charCountControl').classList.remove('vis')
                            document.getElementById('submitPost').setAttribute('disabled', 'disabled');
                        }
                    })
                }
            }

            this.updatePaginatorButtons()

        }, 800)
    }

    updatePaginatorButtons() {
        if (this.state.currentFeedPage > 1) {
            document.querySelector('#paginatorPrevious').classList.add('vis')
        } else {
            document.querySelector('#paginatorPrevious').classList.remove('vis')
        }

        if (this.state.lastFeedPage == false) {
            document.querySelector('#paginatorNext').classList.add('vis')
        } else {
            document.querySelector('#paginatorNext').classList.remove('vis')
        }
    }

    handleSubmit() {
        let postInput = document.querySelector('#postInput');
        fetch('',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.state.csrftoken
                },
                body: JSON.stringify({
                    text: postInput.value
                })
            })
            .then(response => response.json())

        postInput.value = ""

        // Fetching updated list with all posts
        setTimeout(() => {
            fetch(`/feed/${this.state.view}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.state.csrftoken
                },
                body: JSON.stringify({
                    username: document.getElementById('page-title').innerHTML,
                    currentFeedPage: this.state.currentFeedPage
                })
            })
                .then(response => response.json())
                .then(result => {
                    this.setState({
                        posts: result["posts"],
                        userLoggedIn: result["userLoggedIn"]
                    });
                })
        }, 500);
    }

    paginatorSubmit(action) {
        if (action == "Next") {
            this.setState(state => ({
                currentFeedPage: state.currentFeedPage + 1
            }))
        } else if (action == "Previous") {
            this.setState(state => ({
                currentFeedPage: state.currentFeedPage - 1
            }))
        }


        fetch(`/feed/${this.state.view}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                username: document.getElementById('page-title').innerHTML,
                currentFeedPage: this.state.currentFeedPage
            })
        })
            .then(response => response.json())
            .then(result => {
                this.setState({
                    posts: result["posts"],
                    userLoggedIn: result["userLoggedIn"],
                    lastFeedPage: result["lastFeedPage"]
                });
            })

        setTimeout(() => {
            this.updatePaginatorButtons()
        }, 300);

    }

    comment() {
        let likeRow = document.querySelector('.likes');
        likeRow.querySelector(':scope > div > i').className = "fas fa-heart"
        document.querySelector('.likes').className = "likes active"
        document.querySelector('.likeCount').innerHTML = parseInt(document.querySelector('.likeCount').innerHTML) + 1
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            let cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = jQuery.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

class MainTable extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h1 id="page-title">{this.props.pageTitle}</h1>
                {this.props.view == "allposts" && <PostForm />}
                {this.props.view == "profile" && <ProfileTable getCookie={this.props.getCookie} />}
                <PostsTable posts={this.props.posts} paginatorSubmit={this.props.paginatorSubmit} currentFeedPage={this.props.currentFeedPage} lastFeedPage={this.props.lastFeedPage} getCookie={this.props.getCookie} />
            </div >
        );
    }
};

class PostForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            textfield: '',
            charCount: 0
        }
    }
    render() {
        return (
            <div id="postForm" className="element-control">
                <form>
                    <div className="form-group">
                        <label>New Post</label>
                        <textarea id="postInput" className="form-control" rows="2" maxLength="280"
                            placeholder="What´s happening?"></textarea>
                        <div id="sL">
                            <div id="charCountControl">
                                <span id="charCount">{this.state.charCount}</span>
                                <span id="charMax"> / 280</span>
                            </div>
                            <div>
                                <button type="button" id="submitPost" className="btn btn-primary"
                                    disabled="disabled">Post</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
};

class PostsTable extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        const paginatorPrevious =
            <button id="paginatorPrevious" type="button" value="Previous" className="btn btn-primary paginatorBtn">Previous</button>

        const paginatorNext =
            <button id="paginatorNext" type="button" value="Next" className="btn btn-primary paginatorBtn">Next</button>
        return (
            <div id="posts">
                { paginatorPrevious}
                { this.props.posts.map(post =>
                    <Post
                        key={post["id"]}
                        id={post["id"]}
                        alreadyLiked={post["alreadyLiked"]}
                        alreadyRetweeted={post["alreadyRetweeted"]}
                        data-op={post["ownPost"]}
                        username={post["username"]}
                        text={post["text"]}
                        likes={post["likes"]}
                        retweets={post["retweets"]}
                        comments={post["comments"]}
                        timestamp={post["timestamp"]}
                        getCookie={this.props.getCookie}
                    />
                )}
                { paginatorNext}
            </div>
        );
    }


    componentDidMount() {
        setTimeout(() => {
            document.querySelector('#paginatorPrevious').addEventListener('click', () => this.props.paginatorSubmit(document.querySelector('#paginatorPrevious').value));
            document.querySelector('#paginatorNext').addEventListener('click', () => this.props.paginatorSubmit(document.querySelector('#paginatorNext').value));
        }, 500);

    }
};


class Post extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            username: props.username,
            text: props.text,
            timestamp: props.timestamp,
            commentCount: 0,
            retweetCount: props.retweets,
            likeCount: props.likes,
            currentUsercomment: false,
            currentUserretweet: props["alreadyRetweeted"],
            currentUserlike: props["alreadyLiked"],
            ownPost: props["data-op"],
            csrftoken: props.getCookie('csrftoken')
        }

        this.handleClick = this.handleClick.bind(this);
    }


    render() {
        const Icon = (props) => {
            let socialIcon
            if (props.actionName == "comment") {
                socialIcon =
                    this.state.currentUsercomment ?
                        <path fill="currentColor" d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"></path>
                        :
                        <path fill="currentColor" d="M256 32C114.6 32 0 125.1 0 240c0 47.6 19.9 91.2 52.9 126.3C38 405.7 7 439.1 6.5 439.5c-6.6 7-8.4 17.2-4.6 26S14.4 480 24 480c61.5 0 110-25.7 139.1-46.3C192 442.8 223.2 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32zm0 368c-26.7 0-53.1-4.1-78.4-12.1l-22.7-7.2-19.5 13.8c-14.3 10.1-33.9 21.4-57.5 29 7.3-12.1 14.4-25.7 19.9-40.2l10.6-28.1-20.6-21.8C69.7 314.1 48 282.2 48 240c0-88.2 93.3-160 208-160s208 71.8 208 160-93.3 160-208 160z"></path>
            } else if (props.actionName == "retweet") {
                socialIcon =
                    <path fill="currentColor" d="M629.657 343.598L528.971 444.284c-9.373 9.372-24.568 9.372-33.941 0L394.343 343.598c-9.373-9.373-9.373-24.569 0-33.941l10.823-10.823c9.562-9.562 25.133-9.34 34.419.492L480 342.118V160H292.451a24.005 24.005 0 0 1-16.971-7.029l-16-16C244.361 121.851 255.069 96 276.451 96H520c13.255 0 24 10.745 24 24v222.118l40.416-42.792c9.285-9.831 24.856-10.054 34.419-.492l10.823 10.823c9.372 9.372 9.372 24.569-.001 33.941zm-265.138 15.431A23.999 23.999 0 0 0 347.548 352H160V169.881l40.416 42.792c9.286 9.831 24.856 10.054 34.419.491l10.822-10.822c9.373-9.373 9.373-24.569 0-33.941L144.971 67.716c-9.373-9.373-24.569-9.373-33.941 0L10.343 168.402c-9.373 9.373-9.373 24.569 0 33.941l10.822 10.822c9.562 9.562 25.133 9.34 34.419-.491L96 169.881V392c0 13.255 10.745 24 24 24h243.549c21.382 0 32.09-25.851 16.971-40.971l-16.001-16z"></path>
            } else {
                socialIcon =
                    this.state.currentUserlike ?
                        <path fill="currentColor" d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path>
                        :
                        <path fill="currentColor" d="M458.4 64.3C400.6 15.7 311.3 23 256 79.3 200.7 23 111.4 15.6 53.6 64.3-21.6 127.6-10.6 230.8 43 285.5l175.4 178.7c10 10.2 23.4 15.9 37.6 15.9 14.3 0 27.6-5.6 37.6-15.8L469 285.6c53.5-54.7 64.7-157.9-10.6-221.3zm-23.6 187.5L259.4 430.5c-2.4 2.4-4.4 2.4-6.8 0L77.2 251.8c-36.5-37.2-43.9-107.6 7.3-150.7 38.9-32.7 98.9-27.8 136.5 10.5l35 35.7 35-35.7c37.8-38.5 97.8-43.2 136.5-10.6 51.1 43.1 43.5 113.9 7.3 150.8z"></path>
            }

            return (
                <div onClick={this.handleClick} className={props.class} data-an={props.actionName}>
                    <div className="iconControl">
                        <svg className="socialIcon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            {socialIcon}
                        </svg>
                    </div>
                    <div className={"iconCounter " + props.counterClass}>{this.state[props.actionName + "Count"]}</div>
                </div>
            )
        }

        return (
            <div data-id={this.state.id} data-al={this.state.userLiked} style={{ display: "flex" }} className="element-control">
                <div>
                    <a href={this.state.username}>
                        <svg aria-hidden="true" focusable="false" style={{ marginRight: 10, width: 35 }} role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                            <path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z">
                            </path>
                        </svg>
                    </a>
                </div>
                <div className="post-content">
                    <a href={this.state.username}>
                        <b>
                            <div style={{ marginRight: 10, width: "max-content", display: "inline-block" }}>{this.state.username}</div>
                        </b>
                    </a>
                    <span>@{this.state.username} &#183; {this.state.timestamp}</span>
                    {this.state.ownPost &&
                        <div id="editBtn" className="iconControl">
                            <svg className="socialIcon" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                <path fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z">
                                </path>
                            </svg>
                        </div>
                    }
                    <br /><br />
                    {this.state.text}
                    <br />
                    <div>
                        <div className="iconRow">
                            <Icon
                                class={this.state.currentUsercomment ? "comments active" : "comments"}
                                actionName="comment"
                                counterClass="commentCounter"
                            />
                            <Icon
                                class={this.state.currentUserretweet ? "retweets active" : "retweets"}
                                actionName="retweet"
                                counterClass="retweetCounter"
                            />
                            <Icon
                                class={this.state.currentUserlike ? "likes active" : "likes"}
                                actionName="like"
                                counterClass="likeCounter"
                            />
                        </div>
                    </div>
                </div>
            </div >
        );
    }

    handleClick(event) {
        const actionName = event.currentTarget.dataset.an
        let action = ""

        if (!this.state["currentUser" + actionName]) {
            this.setState(state => ({
                [actionName + "Count"]: state[actionName + "Count"] + 1,
                ["currentUser" + actionName]: true
            }));
            action = actionName;
        } else {
            this.setState(state => ({
                [actionName + "Count"]: state[actionName + "Count"] - 1,
                ["currentUser" + actionName]: false
            }));
            action = "un" + actionName;
        }

        fetch(`/post/${this.state.id}`,
            {
                credentials: 'include',
                method: 'POST',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.state.csrftoken
                },
                body: JSON.stringify({
                    action: action,
                    post_id: this.state.id
                })
            })
            .then(response => response.json())
            .then(result => {
            });
    }
};

class ProfileTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            profile: "",
            csrftoken: props.getCookie('csrftoken'),
            profileName: document.querySelector('#main').getAttribute(['data-pn'])
        }

        this.follow = this.follow.bind(this)
    }

    render() {
        let button = false

        if (this.state.profile.ownProfile === false) {
            if (this.state.profile.alreadyFollowing === false) {
                button = <button id="followBtn" className="btn btn-primary" value="follow">Follow</button>
            } else {
                button = <button id="followBtn" className="btn btn-primary" value="unfollow">Unfollow</button>
            }
        } else {
            button = false
        }

        return (
            <div className="element-control" >
                <h2>{this.state.profile.name == ' ' ? this.state.profile.username : this.state.profile.name}</h2>
                <span style={{ color: "lightgrey" }}>@{this.state.profile.username}</span>
                <br />
                <div id="profileCounter">
                    <span style={{ marginRight: 10 }}><b id="followingCount">{this.state.profile.followingCount}</b> Following</span>
                    <span><b id="followerCount">{this.state.profile.followerCount}</b> Followers</span>
                </div>
                {button != false && button}
            </div>
        )
    }

    follow(action) {
        // Update Followercount
        if (action === "follow") {
            document.querySelector('#followBtn').setAttribute(['value'], 'unfollow');
            document.querySelector('#followBtn').innerHTML = 'Unfollow';
            document.querySelector('#followerCount').innerHTML = parseInt(document.querySelector('#followerCount').innerHTML) + 1

        } else {
            document.querySelector('#followBtn').setAttribute(['value'], 'follow');
            document.querySelector('#followBtn').innerHTML = 'Follow';
            document.querySelector('#followerCount').innerHTML = parseInt(document.querySelector('#followerCount').innerHTML) - 1
        }

        fetch(`/${this.state.profileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                action: action,
                username: this.state.profileName
            })
        })
    }

    componentDidMount() {
        fetch(`/${this.state.profileName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                username: this.state.profileName,
                action: "getprofile"
            })
        })
            .then(response => response.json())
            .then(result => {
                this.setState({
                    profile: result
                });
            })

        setTimeout(() => {
            if (this.state.profile.ownProfile === false) {
                document.querySelector('#followBtn').addEventListener('click', () => this.follow(document.querySelector('#followBtn').value));
            }
        }, 500);

    }

}

ReactDOM.render(<App />, document.querySelector('#main'));