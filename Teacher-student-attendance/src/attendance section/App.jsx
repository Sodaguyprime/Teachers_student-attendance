import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import QRCodeSection from './components/QRCodeSection';
import AttendanceSection from './components/AttendanceSection';

const App = () => {
  const [students, setStudents] = useState([]);
  const [serverIP, setServerIP] = useState('');
  const [port, setPort] = useState('3000');

  const fetchStudents = () => {
    api.getStudents()
      .then(data => setStudents(data))
      .catch(err => console.error('Error fetching students:', err));
  };

  useEffect(() => {
    api.getServerInfo()
      .then(data => {
        setServerIP(data.ipAddress);
        setPort(data.port);
      })
      .catch(err => console.error('Error fetching IP:', err));

    fetchStudents();
    const interval = setInterval(fetchStudents, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Teacher Attendance System
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QRCodeSection serverIP={serverIP} port={port} />
          <AttendanceSection students={students} onRefresh={fetchStudents} />
        </div>
      </div>
    </div>
  );
};

export default App;