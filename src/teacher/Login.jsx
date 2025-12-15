import React, { useState } from 'react';
import './Stylings/Login.css';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { userId, password });

  };

  return (
    <div className="login-container">
      <div className="login-split">

        <div className="right-panel">
          <div className="login-form-container">
            <h1>Login to your<br />Teachers dashboard</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="USER ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="login-input"
                />
              </div>
              
              <div className="input-group">
                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>
              
              <button type="submit" className="login-button">
                LOGIN
              </button>
              
              <div className="forgot-password">
                <a href="MainArea">Go to main page</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;