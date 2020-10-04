class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: [],
            feedView: "allposts",
            csrftoken: this.getCookie('csrftoken')
        };
        this.handleSubmit = this.handleSubmit.bind(this)
        this.getCookie = this.getCookie.bind(this)
        this.like = this.like.bind(this)
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
            fetch(`/feed/${this.state.feedView}`)
                .then(response => response.json())
                .then(result => {
                    this.setState({ posts: result });
                })
            , 1500);
    }

    componentDidMount() {
        fetch(`/feed/${this.state.feedView}`)
            .then(response => response.json())
            .then(result => {
                this.setState({ posts: result });
            })

        document.querySelector('#submitPost').addEventListener('click', () => this.handleSubmit());
    }

    like(post_id) {
        let post = document.querySelector(`div[data - id= "${post_id}"]`);

        //likeRow.querySelector(':scope > div > i').className = "fas fa-heart"
        document.querySelector('.likes').className = "likes active"
        document.querySelector('.likeCount').innerHTML = parseInt(document.querySelector('.likeCount').innerHTML) + 1
        //let likeIcon = document.querySelector('#likeIcon').className = "far fa-comment-alt"
    }

    comment() {
        let likeRow = document.querySelector('.likes');
        likeRow.querySelector(':scope > div > i').className = "fas fa-heart"
        document.querySelector('.likes').className = "likes active"
        document.querySelector('.likeCount').innerHTML = parseInt(document.querySelector('.likeCount').innerHTML) + 1
        //let likeIcon = document.querySelector('#likeIcon').className = "far fa-comment-alt"
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
        console.log(this.state.posts)
        return (
            <div>
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
        );
    }
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

ReactDOM.render(<App />, document.querySelector('#posts'));