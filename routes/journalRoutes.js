import express from 'express';
import pool from '../db/connect.js';

const router = express.Router();

function toLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // e.g. 2025-06-05
}

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ message: 'Please log in' });
}

// GET all journal entries for the logged-in user
router.get('/entries', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY entry_date DESC',
      [userId]
    );

    const entries = result.rows.map(entry => {
      return {
        ...entry,
        entry_date: toLocalDateString(entry.entry_date), // For input fields (YYYY-MM-DD)
        formatted_date: new Date(entry.entry_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }), // For display (e.g. 5 June 2025)
      };
    });

    res.json(entries);
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ message: 'Error fetching entries' });
  }
});

// POST a new journal entry
router.post('/entries', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { content, entry_date } = req.body;

    const result = await pool.query(
      'INSERT INTO journal_entries (user_id, content, entry_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, entry_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding entry:', err);
    res.status(500).json({ message: 'Error adding entry' });
  }
});

// PUT (update) an existing journal entry by id
router.put('/entries/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;
    const { content, entry_date } = req.body;

    const result = await pool.query(
      'UPDATE journal_entries SET content = $1, entry_date = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [content, entry_date, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ message: 'Error updating entry' });
  }
});

// DELETE a journal entry by id
router.delete('/entries/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }

    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ message: 'Error deleting entry' });
  }
});

export default router;
