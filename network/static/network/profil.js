class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: [],
            feedView: "profil",
            name: '',
            username: window.location.pathname.slice(1),
            followingCount: '',
            followerCount: '',
            alreadyFollowing: '',
            ownProfil: '',
            action: "getProfil",
            csrftoken: this.getCookie('csrftoken')
        };
        this.handleSubmit = this.handleSubmit.bind(this)
        this.getCookie = this.getCookie.bind(this)
        this.follow = this.follow.bind(this)
    }
    handleSubmit() {
        return false;
    }

    componentDidMount() {
        // Get user profile
        fetch(`/${this.state.username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                action: this.state.action,
                username: this.state.username
            })
        })
            .then(response => response.json())
            .then(result => {
                console.log(result)
                this.setState({
                    name: result["name"],
                    followingCount: result["followingCount"],
                    followerCount: result["followerCount"],
                    alreadyFollowing: result["alreadyFollowing"],
                    ownProfil: result["ownProfil"]
                });
            })

        // Get user posts
        fetch(`/feed/${this.state.feedView}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                username: this.state.username
            })
        })
            .then(response => response.json())
            .then(result => {
                this.setState({ posts: result["posts"] });
            })

        setTimeout(() => {
            if (this.state.ownProfil === "false") {
                document.querySelector(`#followBtn`).addEventListener('click', () => this.follow(document.querySelector('#followBtn').value));
            }
            return false;
        }, 800)

    }

    follow(action) {
        // Update Followercount
        if (action === "follow") {
            this.setState(state =>
                ({
                    followerCount: state.followerCount + 1,
                    alreadyFollowing: "true"
                }));
        } else {
            this.setState(state =>
                ({
                    followerCount: state.followerCount - 1,
                    alreadyFollowing: "false"
                }));
        }
        fetch(`/${this.state.username}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            body: JSON.stringify({
                action: action,
                username: this.state.username
            })
        })
    }

    getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
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
                <div id="profil">
                    <Profil
                        username={this.state.username}
                        ownProfil={this.state.ownProfil}
                        alreadyFollowing={this.state.alreadyFollowing}
                        name={this.state.name}
                        followingCount={this.state.followingCount}
                        followerCount={this.state.followerCount}
                    />
                </div>
                <div id="posts">
                    {this.state.posts.map(post =>
                        <Post
                            key={post["id"]}
                            id={post["id"]}
                            data-al={post["alreadyLiked"]}
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
            <div data-id={this.state.id} data-al={this.state.alreadyLiked} className="element-control">
                <a href={this.state.username}>
                    <b>
                        <i style={{ marginRight: 10 }} className="fas fa-user-circle"></i>
                        <div style={{ marginRight: 10, width: "max-content", display: "inline-block" }}>{this.state.username}</div>
                    </b>
                </a>
                <span>@{this.state.username} &#183; 45m</span>
                <br /><br />
                <a href="#">Edit</a>
                <br />
                { this.state.text}
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
                    <div className={this.state.alreadyLiked ? "likes active" : "likes"}>
                        <div><i className={this.state.alreadyLiked ? "fas fa-heart" : "far fa-heart"}></i></div>
                        <div className="likeCount" style={{ width: "max-content", display: "inline-block", paddingBottom: 3 }}>{this.state.likes}</div>
                    </div>
                </div>
            </div >
        );
    }
};


ReactDOM.render(<App />, document.querySelector('#main'));