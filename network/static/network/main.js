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
    }
    handleSubmit() {
        let postInput = document.querySelector('#postInput');
        console.log("RUN")
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
        console.log(postInput.value)
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
                {this.state.posts.map(post =>
                    <Post key={post["id"]} username={post["username"]} text={post["text"]} timestamp={post["timestamp"]} />
                )}
            </div>
        );
    }
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

ReactDOM.render(<App />, document.querySelector('#posts'));