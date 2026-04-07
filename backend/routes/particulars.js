const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../db');

async function getRequester(req, res, next) {
    const requesterId = req.headers['x-user-id'] || req.query.requesterId;
    if (!requesterId) return res.status(401).json({ message: 'Missing user context' });
    const user = await dbGet('SELECT * FROM User WHERE id = ?', [requesterId]);
    if (!user) return res.status(404).json({ message: 'Requester not found' });
    req.user = user;
    next();
}

router.use(getRequester);

// GET /api/particulars - all roles can read
router.get('/', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM Particular ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/particulars - Admin/Superadmin only
router.post('/', async (req, res) => {
    if (req.user.role === 'OPERATOR') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { name, costPrice } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        await dbRun('INSERT INTO Particular (name, costPrice) VALUES (?, ?)', [name.trim(), costPrice || 0]);
        res.status(201).json({ message: 'Particular created' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Particular with this name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/particulars/:id - Admin/Superadmin only
router.put('/:id', async (req, res) => {
    if (req.user.role === 'OPERATOR') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { name, costPrice } = req.body;
        await dbRun('UPDATE Particular SET name=?, costPrice=? WHERE id=?', [name.trim(), costPrice || 0, req.params.id]);
        res.json({ message: 'Particular updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/particulars/:id - Superadmin only
router.delete('/:id', async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') return res.status(403).json({ message: 'Only Superadmin can delete particulars' });
    try {
        await dbRun('DELETE FROM Particular WHERE id=?', [req.params.id]);
        res.json({ message: 'Particular deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
