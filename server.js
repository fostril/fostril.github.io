const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Database connection setup
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // Replace with your database username
    password: '',  // Replace with your database password
    database: 'auth_db',  // Replace with your database name
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

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    pool.query('SELECT password FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({status: 'error', message: 'Database error'});
            return;
        }
        if (results.length === 0) {
            res.status(401).json({status: 'error', message: 'User not found'});
            return;
        }
        const hashedPassword = results[0].password;
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            res.json({status: 'ok', message: 'Login successful', redirectUrl: '/redirect.html'});
        } else {
            res.status(401).json({status: 'error', message: 'Invalid credentials'});
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
