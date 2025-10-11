import './Login.css';


function Login(){

    return(< >
    <div className="login-form">
        <h1> Login</h1>
        <form>
        <div className="user-name">
            <input
                type = "text"
                id = "username"
                name = "username"
                placeholder = "username"
                className="text_input"
                />
        </div>
            <div className="password">
                <input
                    type = "password"
                    id = "password"
                    name = "password"
                    placeholder = "password"
                    className="text_input"
                />
            </div>
            <input
                type="submit"
                value="LOGIN"
                className="btn"
            />
        </form>
    </div>

        </>
    );
}

export default Login