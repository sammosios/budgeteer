const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const port = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use environment variable in production

app.use(express.json());
app.use(cors({ origin: 
    [
        'https://budgeteer.sammosios.com',
        'https://dev.budgeteer.sammosios.com'    
    ]  }));

// Ensure budget.db exists or create it before initializing sqlite3.Database
const dbPath = './budget.db';
if (!fs.existsSync(dbPath)) {
    // Create an empty file synchronously
    fs.closeSync(fs.openSync(dbPath, 'w'));
    console.log('budget.db not found, creating new database file.');
}

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL
            )`, (createErr) => {
                if (createErr) {
                    console.error('Error creating users table:', createErr.message);
                } else {
                    console.log('Users table created or already exists.');
                }
            });

            // Create transactions table with user_id
            db.run(`CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (createErr) => {
                if (createErr) {
                    console.error('Error creating transactions table:', createErr.message);
                } else {
                    console.log('Transactions table created or already exists.');
                    // Add currency column if it doesn't exist (for existing databases)
                    db.run(`ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD'`, (alterErr) => {
                        if (alterErr) {
                            if (!alterErr.message.includes('duplicate column name')) {
                                console.error('Error altering transactions table to add currency column:', alterErr.message);
                            }
                        }
                    });
                    // Add user_id column if it doesn't exist (for existing databases)
                    db.run(`ALTER TABLE transactions ADD COLUMN user_id INTEGER`, (alterErr) => {
                        if (alterErr) {
                            if (!alterErr.message.includes('duplicate column name')) {
                                console.error('Error altering transactions table to add user_id column:', alterErr.message);
                            }
                        }
                    });
                }
            });
        });
    }
});

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Unauthorized' }); // No token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' }); // Invalid token
        req.user = user;
        next();
    });
}

// Register new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        db.run(`INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)`,
            [username, password_hash, salt],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Username already exists.' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'User registered successfully.', userId: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials.' });
        }

        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    });
});

// API to add a new transaction (protected)
app.post('/transactions', authenticateToken, (req, res) => {
    const { date, amount, category, type, currency } = req.body;
    const user_id = req.user.id; // Get user_id from authenticated token

    if (!date || !amount || !category || !type || !currency) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    db.run(`INSERT INTO transactions (user_id, date, amount, category, type, currency) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, date, amount, category, type, currency],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, date, amount, category, type, currency });
        }
    );
});

// API to get all transactions (protected)
app.get('/transactions', authenticateToken, (req, res) => {
    const user_id = req.user.id; // Get user_id from authenticated token
    // Support ?ascending=true or ?order=asc/desc
    let order = 'DESC';
    if (req.query.ascending !== undefined) {
        order = req.query.ascending === 'true' ? 'ASC' : 'DESC';
    } else if (req.query.order) {
        order = req.query.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    }
    db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY date ${order}`,[user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// API to delete a transaction (protected)
app.delete('/transactions/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id; // Get user_id from authenticated token

    db.run(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, user_id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found or not authorized.' });
        }
        res.status(200).json({ message: 'Transaction deleted successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});