const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const os = require('os');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
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

// API endpoint to register student attendance
app.post('/register-attendance', (req, res) => {
    const { studentNumber, name, surname } = req.body;

    if (!studentNumber || !name || !surname) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const timestamp = new Date().toISOString();
    const ipAddress = req.ip || req.connection.remoteAddress;

    const student = {
        studentNumber,
        name,
        surname,
        timestamp,
        ipAddress
    };

    students.push(student);

    // Emit to all connected clients (teacher interfaces)
    io.emit('new-attendance', student);

    res.status(200).json({ success: true, message: 'Attendance registered' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A client connected');

    // Send current students list
    socket.emit('students-list', students);

    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Generate QR code API
app.get('/generate-qr', async (req, res) => {
    const ipAddress = getLocalIpAddress();
    const port = process.env.PORT || 3000;
    const url = `http://${ipAddress}:${port}/student-login.html`;

    try {
        const qrCodeDataUrl = await qrcode.toDataURL(url);
        res.json({
            qrCode: qrCodeDataUrl,
            url: url,
            ipAddress: ipAddress
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Export attendance data as CSV
app.get('/export-csv', (req, res) => {
    let csvContent = 'Student Number,Name,Surname,Timestamp,IP Address\n';

    students.forEach(student => {
        csvContent += `${student.studentNumber},${student.name},${student.surname},${student.timestamp},${student.ipAddress}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.send(csvContent);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const ipAddress = getLocalIpAddress();
    console.log(`Server running on http://${ipAddress}:${PORT}`);
});