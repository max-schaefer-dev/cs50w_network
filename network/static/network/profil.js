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
                action: "getProfil",
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
                this.setState({ posts: result });
            })

        setTimeout(() => {
            if (this.state.ownProfil === "false") {
                document.querySelector(`#followBtn`).addEventListener('click', () => this.follow(document.querySelector('#followBtn').value));
            }
            return false;
        }, 500)

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
                    <Profil username={this.state.username} ownProfil={this.state.ownProfil} alreadyFollowing={this.state.alreadyFollowing} name={this.state.name} followingCount={this.state.followingCount} followerCount={this.state.followerCount} />
                </div>
                <div id="posts">
                    {this.state.posts.map(post =>
                        <Post key={post["id"]} username={post["username"]} text={post["text"]} timestamp={post["timestamp"]} />
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
            {/*<h2>{props.firstName && props.firstName} {props.firstName === '' ? props.username : props.firstName}</h2> */}
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

let Post = (props) => {
    return (
        <div className="element-control">
            <a href={props.username}>
                <b>
                    <i className="fas fa-user-circle"></i>
                    {props.username}
                </b>
            </a>
            <span>@{props.username} &#183; 45m</span>
            <br /><br />
            <a href="#">Edit</a>
            <br />
            {props.text}
            <br />
            <span>
                {props.timestamp}
            </span>
            <br />
            <span><i className="fas fa-heart"></i> 0</span>
            <br />
            <span>Comment</span>
        </div>
    );
};

ReactDOM.render(<App />, document.querySelector('#main'));