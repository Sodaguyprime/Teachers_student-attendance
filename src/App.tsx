import React from 'react';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';
import { Profile } from './Profile';

const App = () => {
  return (
    <div>
      <h1>React App with Auth0 Authentication</h1>
      <LoginButton />
      <LogoutButton />
      <Profile />
    </div>
  );
};

export default App;