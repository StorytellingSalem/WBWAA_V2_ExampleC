const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// File Upload Setup (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // High limit per file
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.')));

// Database Setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            company TEXT,
            service TEXT,
            budget TEXT,
            timeline TEXT,
            details TEXT,
            attachments TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating table:', err.message);
        });
        
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT,
            phone TEXT,
            password_hash TEXT,
            salt TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating table:', err.//message);
        });
    }
});

// API Endpoint for Form Submissions
app.post('/api/quote', upload.array('images', 45),details, honeypot } = req.body;

    if (honeypot) {
        console.log('Bot detected. Ignoring request.');
        return res.status(200).json({ message: 'Quote request received successfully!' });
    }

    if (!email && !phone) {
        return res.status(400).json({ error: 'Please provide either an email address or a phone number.' });
    }

    const attachments = req.files ? req.files.map(f => f.filename).join(',') : '';

    const sql = `INSERT INTO quotes (name, email, phone, company, service, details, attachments) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, email, phone, company, servic
    const params = [name, email, phone, company, service, budget, timeline, details, attachments];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error inserting quote:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ message: 'Quote request received successfully!', id: this.lastID });
    });
});

// User Authentication API
app.post('/api/signup', (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (!email && !phone) {
        return res.status(400).json({ error: 'Either email or phone number is required.' });
    }

    // PBKDF2 Hashing Logic
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

    const sql = `INSERT INTO users (username, email, phone, password_hash, salt) VALUES (?, ?, ?, ?, ?)`;
    const params = [username, email, phone, hash, salt];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists.' });
            }
            return res.status(500).json({ error: 'Internal server error.' });
        }
        res.status(201).json({ message: 'Account created successfully!' });
    });
});

app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body; // identifier can be email, phone, or username

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Please provide login credentials.' });
    }

    const sql = `SELECT * FROM users WHERE (email = ? OR phone = ? OR username = ?)`;
    const params = [identifier, identifier, identifier];

    db.get(sql, params, (err, row) => {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        if (!row) return res.status(401).json({ error: 'Invalid credentials.' });

        // Verify Hash using PBKDF2
        const verifyHash = crypto.pbkdf2Sync(password, row.salt, 100000, 64, 'sha512').toString('hex');
        
        if (verifyHash !== row.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        res.json({ message: 'Login successful!', user: { username: row.username, email: row.email, phone: row.phone } });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
