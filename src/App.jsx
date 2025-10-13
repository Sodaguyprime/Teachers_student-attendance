import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './Login';
import MainArea from './teacher/MainArea';
import './App.css';
const App = () => {

  return(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/MainArea" element={<MainArea />} />
        </Routes>
    </BrowserRouter>
  );  
};

export default App;