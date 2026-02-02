const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin Config
const ADMIN_PASSWORD = '335524JI';

// File Paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');

// Create necessary folders if they don't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper to read users
const getUsers = () => {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
};

// Helper to save users
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- API ROUTES ---

// 1. User Registration
app.post('/api/register', upload.single('profileImage'), (req, res) => {
    try {
        const { name, email, password } = req.body;
        const profileImage = req.file ? req.file.filename : null;

        if (!name || !email || !password || !profileImage) {
            return res.status(400).json({ message: 'All fields including image are required.' });
        }

        const users = getUsers();

        // Duplicate account check
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            profileImage
        };

        users.push(newUser);
        saveUsers(users);

        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 2. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// 3. View All Registered Users (Admin)
app.get('/api/admin/users', (req, res) => {
    // In a real app, you'd check a session/token here. 
    // For this simple version, we'll assume the frontend only calls this after login.
    try {
        const users = getUsers();
        // Return only what's needed for the panel
        const userList = users.map(u => ({
            name: u.name,
            email: u.email,
            profileImage: u.profileImage
        }));
        res.json(userList);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// 4. Default Routing - Serve Register Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Admin Panel available at http://localhost:${PORT}/admin.html`);
});
