import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './teacher/Login';
import MainArea from './teacher/MainArea';
import QRCodeSection from './teacher/QRCodeSection';
import './App.css';
const App = () => {

  return(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/MainArea" element={<MainArea />} />
            <Route path="/QRCodeSection" element={<QRCodeSection/>} />
        </Routes>
    </BrowserRouter>
  );  
};

export default App;