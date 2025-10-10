import './index.css';

function Teacher(){

}

function Student(){

}

function Login(){
    return(<>
    <h1>Select Role:</h1>
    <div className="login-contianer">
        <button onClick={Teacher}>Teacher</button>
        <button onClick={Student}>Student</button>
    </div>
        </>
    );
}

export default Login