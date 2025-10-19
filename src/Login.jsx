import React, { useState } from 'react';
import './Login.css';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { userId, password });
    // Add your login logic here
  };

  return (
    <div className="login-container">
      <div className="login-split">
        <div className="left-panel">
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms of Use</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>

        <div className="right-panel">
          <div className="login-form-container">
            <h1>Login to your<br />student dashboard</h1>
            
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
                <a href="MainArea">Go to main page tawali</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;