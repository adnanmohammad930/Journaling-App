import express from 'express';
import pool from '../db/connect.js';  // your DB connection
const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).send('User already exists');
    }

    // Insert new user into DB
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);

    // Redirect to login page after successful registration
    res.redirect('/login');  // <-- changed from '/' to '/login' to send user directly to login page
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error');
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const userQuery = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);

    if (userQuery.rows.length === 0) {
      return res.status(401).send('Invalid username or password');
    }

    // Save user info to session
    req.session.user = {
      id: userQuery.rows[0].id,
      username: userQuery.rows[0].username,
    };

    // Redirect to journal page after login
    res.redirect('/journal');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

export default router;
