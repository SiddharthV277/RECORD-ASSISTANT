const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { dbGet } = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, branchId } = req.body;
        
        let query = 'SELECT * FROM User WHERE email = ?';
        let params = [email];
        
        // Optionally strict branch checking if passed explicitly (useful for non-global logins)
        if (branchId) {
            query += ' AND branchId = ?';
            params.push(branchId);
        }

        const user = await dbGet(query, params);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return user without password
        const { password: _, ...userSafe } = user;
        
        // Also fetch branch name for frontend convenience
        const branchRow = await dbGet('SELECT name FROM Branch WHERE id = ?', [user.branchId]);
        if (branchRow) userSafe.branchName = branchRow.name;

        res.json({ message: 'Login successful', user: userSafe });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
