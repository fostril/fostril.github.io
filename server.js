const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
let sessionEmail = null

const app = express();
const port = 3000;

function checkLoggedIn(req, res, next) {
    if (!sessionEmail) {
        res.redirect('/index.html'); // Redirect to login page if not logged in
    } else {
        next(); // Proceed if logged in
    }
}

// Session setup
app.use(session({
    secret: 'idkidkidk', // This secret key should be a random, high-entropy string
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
}));

// Database connection setup
const pool = mysql.createPool({
    host: 'roundhouse.proxy.rlwy.net',
    port: '54925',
    user: 'root',  // Replace with your database username
    password: 'SFCHjaWdMsdTzXnZGZcWrsQGGPRsBSbq',  // Replace with your database password
    database: 'railway',  // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(bodyParser.json());
app.use(express.static('public'));

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Check if user already exists
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error('Database error on user check:', error);
            res.status(500).json({status: 'error', message: 'Database error checking user existence'});
            return;
        }
        if (results.length > 0) {
            res.json({status: 'error', message: 'Email already exists'});
            return;
        }

        // Hash password and create user
        const saltRounds = 10;
        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (error, results) => {
                if (error) {
                    console.error('Failed to register user:', error);
                    res.status(500).json({status: 'error', message: 'Database error during registration'});
                    return;
                }
                res.json({status: 'ok', message: 'Registration successful'});
            });
        } catch (error) {
            console.error('Error hashing password:', error);
            res.status(500).json({status: 'error', message: 'Error processing your registration'});
        }
    });
});

app.post('/subscribe', (req, res) => {
    // Retrieve user's email from session
    const email = sessionEmail;
    if (!email) {
        res.status(403).json({status: 'error', message: 'No logged-in user'});
        return;
    }

    pool.query('UPDATE users SET subscription = 1 WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Database error during subscription:', error);
            res.status(500).json({status: 'error', message: 'Failed to update subscription'});
            return;
        }
        res.json({status: 'ok', message: 'Subscription updated successfully', redirectUrl: '/redirect.html'});
    });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Modify the query to also select the 'subscription' field
    pool.query('SELECT password, subscription FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({status: 'error', message: 'Database error'});
            return;
        }
        if (results.length === 0) {
            res.status(401).json({status: 'error', message: 'User not found'});
            return;
        }

        const { password: hashedPassword, subscription } = results[0];
        
        // Check if the user has a subscription
        if (!subscription) {
            res.json({status: 'error', message: 'A subscription is required to access this service', redirectUrl: '/subscribe.html'});
            console.log("Attempting to log in user:", req.body.email);
            return sessionEmail = email;
        }

        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            res.json({status: 'ok', message: 'Login successful', redirectUrl: '/redirect.html'});
            console.log("Attempting to log in user:", req.body.email);
            return sessionEmail = email;
        } else {
            res.status(401).json({status: 'error', message: 'Invalid credentials'});
        }
    });
});

app.get('/subscribe.html', checkLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'subscribe.html'));
});

// Serve redirect.html after login check
app.get('/redirect.html', checkLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'redirect.html'));
});