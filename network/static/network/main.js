class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: [],
            userLoggedIn: false,
            view: document.querySelector('#main').getAttribute(['data-vw']),
            csrftoken: this.getCookie('csrftoken')
        };
        this.handleSubmit = this.handleSubmit.bind(this)
        this.getCookie = this.getCookie.bind(this)
        this.follow = this.follow.bind(this)
    }

    componentDidMount() {
        if (this.state.view == "allposts") {
            fetch(`/feed/${this.state.view}`)
                .then(response => response.json())
                .then(result => {
                    console.log(result)
                    this.setState({
                        posts: result["posts"],
                        userLoggedIn: result["userLoggedIn"]
                    });
                })
        } else {
            fetch(`/feed/${this.state.view}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.state.csrftoken
                },
                body: JSON.stringify({
                    username: document.querySelector('#page-title').innerHTML
                })
            })
                .then(response => response.json())
                .then(result => {
                    this.setState({ posts: result["posts"] });
                })

            if (this.state.view == "profil") {
                setTimeout(() => {
                    if (document.querySelector('#profilName').getAttribute(['data-op']) === "0") {
                        document.querySelector(`#followBtn`).addEventListener('click', () => this.follow(document.querySelector('#followBtn').value));
                    }
                    return false;
                }, 600)
            }
        }

        this.state.userLoggedIn && document.querySelector('#submitPost').addEventListener('click', () => this.handleSubmit());
    }

    handleSubmit() {
        let postInput = document.querySelector('#postInput');
        fetch('',
            {
                credentials: 'include',
                method: 'POST',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.state.csrftoken
                },
                body: JSON.stringify({
                    text: postInput.value
                })
            })
            .then(response => response.json())
            .then(result => {
                console.log("result:", result)
            });
        postInput.value = ""

        // Fetching updated list with all posts
        setTimeout(
            fetch(`/feed/${this.state.view}`)
                .then(response => response.json())
                .then(result => {
                    this.setState({ posts: result });
                })
            , 500);
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

        let userName = document.querySelector('#profilName').innerHTML
        fetch(`/${userName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                action: action,
                username: userName
            })
        })
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

    render() {
        return (
            <div>
                <div id="posts">
                    {this.state.posts.map(post =>
                        <Post
                            key={post["id"]}
                            id={post["id"]}
                            data-al={post["alreadyLiked"]}
                            data-oP={post["ownPost"]}
                            username={post["username"]}
                            text={post["text"]}
                            likes={post["likes"]}
                            comments={post["comments"]}
                            timestamp={post["timestamp"]}
                            getCookie={this.getCookie}
                        />
                    )}
                </div>
            </div>
        );
    }
}

let Profil = (props) => {
    let button = "false"
    if (props.ownProfil === "false") {
        if (props.alreadyFollowing === "false") {
            button = <button id="followBtn" className="btn btn-primary" value="follow">Follow</button>
        } else {
            button = <button id="followBtn" className="btn btn-primary" value="unfollow">Unfollow</button>
        }
    } else {
        button = "false"
    }

    return (
        <div>
            <h2>{props.name == ' ' ? props.username : props.name}</h2>
            <span style={{ color: "lightgrey" }}>@{props.username}</span>
            <br />
            <div id="profilCounter">
                <span style={{ marginRight: 10 }}><b id="followingCount">{props.followingCount}</b> Following</span>
                <span><b id="followerCount">{props.followerCount}</b> Followers</span>
            </div>
            {button != "false" && button}
        </div>
    )
}

class Post extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: props.id,
            username: props.username,
            alreadyLiked: props["data-al"],
            text: props.text,
            timestamp: props.timestamp,
            comments: props.comments,
            likes: props.likes,
            retweets: 0,
            ownPost: props["data-oP"],
            csrftoken: props.getCookie('csrftoken')
        }
    }
    componentDidMount() {
        let postColumns = document.querySelector(`[data-id='${this.state.id}']`);
        let action = ""

        postColumns.querySelector('.likes').addEventListener("click", () => {
            if (this.state.alreadyLiked) {
                this.setState(state => ({
                    alreadyLiked: false,
                    likes: state.likes - 1
                }))
                action = "unlike";
            } else {
                this.setState(state => ({
                    alreadyLiked: true,
                    likes: state.likes + 1
                }))
                action = "like";
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
                    console.log("result:", result)
                });
        })
    }

    render() {
        return (
            <div data-id={this.state.id} data-al={this.state.alreadyLiked} style={{ display: "flex" }} className="element-control">
                <div>
                    <a href={this.state.username}>
                        <i style={{ marginRight: 10 }} className="fas fa-user-circle"></i>
                    </a>
                </div>
                <div className="post-content">
                    <a href={this.state.username}>
                        <b>
                            <div style={{ marginRight: 10, width: "max-content", display: "inline-block" }}>{this.state.username}</div>
                        </b>
                    </a>
                    <span>@{this.state.username} &#183; 45m</span>
                    {this.state.ownPost && <div id="editBtn"><i className="fas fa-edit"></i></div>}
                    <br /><br />
                    {this.state.text}
                    <br />
                    <span>
                        {this.state.timestamp}
                    </span>
                    <br />
                    <div className="icon-control">
                        <div className="comments">
                            <div><i className="far fa-comment-alt"></i></div>
                            <div className="commentCount" style={{ width: "max-content", display: "inline-block", paddingBottom: 3 }}>{this.state.comments}</div>
                        </div>
                        <div className="retweets">
                            <div><i className="fas fa-retweet"></i></div>
                            <div className="retweetCount" style={{ width: "max-content", display: "inline-block", paddingBottom: 3 }}>{this.state.retweets}</div>
                        </div>
                        <div className={this.state.alreadyLiked ? "likes active" : "likes"}>
                            <div><i className={this.state.alreadyLiked ? "fas fa-heart" : "far fa-heart"}></i></div>
                            <div className="likeCount" style={{ width: "max-content", display: "inline-block", paddingBottom: 3 }}>{this.state.likes}</div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
};

ReactDOM.render(<App />, document.querySelector('#content'));