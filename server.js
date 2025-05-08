const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected students
const students = [];

// Get local IP address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (loopback) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/student-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
});

// API endpoint to get server IP address
app.get('/get-ip', (req, res) => {
    const ipAddress = getLocalIpAddress();
    const port = process.env.PORT || 3000;
    res.json({
        ipAddress: ipAddress,
        port: port
    });
});

// API endpoint to register student attendance
app.post('/register-attendance', (req, res) => {
    const { studentNumber, name, surname } = req.body;

    if (!studentNumber || !name || !surname) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const timestamp = new Date().toLocaleTimeString();
    const ipAddress = req.ip || req.connection.remoteAddress;

    const student = {
        studentNumber,
        name,
        surname,
        timestamp,
        ipAddress
    };

    students.push(student);
    console.log(`New student registered: ${name} ${surname}`);

    res.status(200).json({
        success: true,
        message: 'Attendance registered',
        studentsCount: students.length
    });
});

// API endpoint to get all registered students
app.get('/students', (req, res) => {
    res.json(students);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const ipAddress = getLocalIpAddress();
    console.log(`Server running on http://${ipAddress}:${PORT}`);
    console.log(`Student login page: http://${ipAddress}:${PORT}/student-login.html`);
});