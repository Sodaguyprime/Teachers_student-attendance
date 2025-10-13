
import {useNavigate} from 'react-router-dom';
const Login = () => {
    const navigate  = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/MainArea');
    }
    return(< >
    <div className="login-form">
        <h1> Login</h1>
        <form onSubmit={handleSubmit}>
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
                type = "submit"
            name = "submit"
            className ="btn"
                value = "Login"
            />
        </form>
    </div>

        </>
    );
}

export default Login