const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');

let mainWindow;

// Initialize express app
const expressApp = express();
const server = http.createServer(expressApp);

// Store connected students and IP addresses
const students = [];
const registeredIPs = new Set();

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

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Set up Express middleware
    expressApp.use(express.json());
    expressApp.use(express.static(path.join(__dirname, 'public')));

    // Routes
    expressApp.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
    });

    expressApp.get('/teacher.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
    });

    expressApp.get('/student-login.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
    });

    // API endpoint to get server IP address
    expressApp.get('/get-ip', (req, res) => {
        const ipAddress = getLocalIpAddress();
        const port = process.env.PORT || 3000;
        res.json({
            ipAddress: ipAddress,
            port: port
        });
    });

    // API endpoint to register student attendance
    expressApp.post('/register-attendance', (req, res) => {
        // Add this near the top of the route
        const url = new URL(req.headers.referer || `http://${req.headers.host}`);
        const tokenFromClient = url.searchParams.get('token');

        if (tokenFromClient !== currentValidToken) {
            return res.status(403).json({ success: false, message: 'Invalid or expired QR token' });
        }

        const { studentNumber, name, surname } = req.body;

        if (!studentNumber || !name || !surname) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get the client's IP address - removed optional chaining
        let ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        if (req.headers['x-forwarded-for']) {
            ipAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
        }

        // Check if this IP address has already registered
        if (registeredIPs.has(ipAddress)) {
            console.log(`Duplicate registration attempt from IP: ${ipAddress}`);
            return res.status(403).json({
                success: false,
                message: 'You have already registered attendance from this device.'
            });
        }

        const timestamp = new Date().toLocaleTimeString();

        const student = {
            studentNumber,
            name,
            surname,
            timestamp,
            ipAddress
        };

        // Add the IP to the set of registered IPs
        registeredIPs.add(ipAddress);

        // Add the student to the list
        students.push(student);
        console.log(`New student registered: ${name} ${surname} from IP: ${ipAddress}`);

        res.status(200).json({
            success: true,
            message: 'Attendance registered',
            studentsCount: students.length
        });
    });

    // API endpoint to get all registered students
    expressApp.get('/students', (req, res) => {
        res.json(students);
    });

    // API endpoint to check if IP has already registered
    expressApp.get('/check-ip', (req, res) => {
        // Get the client's IP address - removed optional chaining
        let ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        if (req.headers['x-forwarded-for']) {
            ipAddress = req.headers['x-forwarded-for'].split(',')[0].trim();
        }

        const hasRegistered = registeredIPs.has(ipAddress);

        res.json({
            registered: hasRegistered,
            ipAddress: ipAddress
        });
    });

    // API endpoint to reset all registrations
    expressApp.get('/reset-registrations', (req, res) => {
        students.length = 0;
        registeredIPs.clear();
        console.log('All registrations have been reset');
        res.json({ success: true, message: 'All registrations have been reset' });
    });

    // Start the server
    const PORT = process.env.PORT || 3000;
    let currentValidToken = null;

    expressApp.post('/set-token', (req, res) => {
        const { token } = req.body;
        if (token && typeof token === 'string') {
            currentValidToken = token;
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, error: 'Invalid token' });
        }
    });

    server.listen(PORT, () => {
        const ipAddress = getLocalIpAddress();
        console.log(`Server running on http://${ipAddress}:${PORT}`);
        console.log(`Student login page: http://${ipAddress}:${PORT}/student-login.html`);
        console.log(`Teacher page: http://${ipAddress}:${PORT}/teacher.html`);

        // Wait a moment for the server to be ready before loading the page
        setTimeout(() => {
            // Load the teacher's page in the Electron window
            mainWindow.loadURL(`http://localhost:${PORT}/teacher.html`);
            console.log(`Loading teacher interface in Electron window...`);
        }, 1000);
    });

    // Open the DevTools to help debug issues
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

// Clean up when app is quitting
app.on('will-quit', () => {
    server.close();
});