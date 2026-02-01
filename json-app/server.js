require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
}

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize users.json
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    console.log('Initialized users.json');
}

// Helper to read users with error handling
const readUsers = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading users file:', err);
        return [];
    }
};

// Helper to write users with atomic write principle (temp file then rename)
const writeUsers = (users) => {
    try {
        const tempFile = USERS_FILE + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(users, null, 2));
        fs.renameSync(tempFile, USERS_FILE);
    } catch (err) {
        console.error('Error writing users file:', err);
        throw new Error('Database write failure');
    }
};

// API Routes
app.post('/api/register', (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

        const users = readUsers();
        if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });

        const newUser = {
            id: Date.now(),
            name,
            email,
            password, // Use bcrypt for real production
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ message: 'Registration successful', user: { name, email } });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = readUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: Buffer.from(ADMIN_PASSWORD).toString('base64') });
    } else {
        res.status(401).json({ message: 'Incorrect password' });
    }
});

app.get('/api/admin/users', (req, res) => {
    const token = req.headers['authorization'];
    if (token !== Buffer.from(ADMIN_PASSWORD).toString('base64')) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = readUsers();
    const sanitized = users.map(({ password, ...rest }) => rest);
    res.json(sanitized);
});

// Catch-all middleware for client-side routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
    console.log(`Using Database at ${USERS_FILE}`);
});
