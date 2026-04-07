const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { dbGet, dbAll, dbRun } = require('../db');

// Helper to get requester
async function getRequester(req, res, next) {
    const requesterId = req.headers['x-user-id'] || req.query.requesterId;
    if (!requesterId) return res.status(401).json({ message: 'Missing user context' });
    
    const user = await dbGet('SELECT * FROM User WHERE id = ?', [requesterId]);
    if (!user) return res.status(404).json({ message: 'Requester not found' });
    
    req.user = user;
    next();
}

router.use(getRequester);

// GET /api/users
router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'SUPERADMIN') {
            const users = await dbAll(`
                SELECT User.id, User.name, User.email, User.role, User.alias, Branch.name as branchName 
                FROM User LEFT JOIN Branch ON User.branchId = Branch.id
            `);
            return res.json(users);
        } else if (req.user.role === 'ADMIN') {
            const users = await dbAll(`
                SELECT User.id, User.name, User.email, User.role, User.alias, Branch.name as branchName 
                FROM User LEFT JOIN Branch ON User.branchId = Branch.id
                WHERE branchId = ?
            `, [req.user.branchId]);
            return res.json(users);
        } else {
            return res.status(403).json({ message: 'Forbidden' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') return res.status(403).json({ message: 'Forbidden' });

    try {
        const { name, email, password, role, alias, branchId } = req.body;
        const hashedStr = await bcrypt.hash(password, 10);
        
        await dbRun(
            'INSERT INTO User (name, email, password, role, alias, branchId) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedStr, role, alias, branchId]
        );
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') return res.status(403).json({ message: 'Forbidden' });

    try {
        await dbRun('DELETE FROM User WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id (e.g. reset password, update info)
router.put('/:id', async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') return res.status(403).json({ message: 'Forbidden' });

    try {
        const userId = req.params.id;
        const { name, email, password, role, alias, branchId } = req.body;
        
        if (password) {
            const hashedStr = await bcrypt.hash(password, 10);
            await dbRun(
                'UPDATE User SET name=?, email=?, password=?, role=?, alias=?, branchId=? WHERE id=?',
                [name, email, hashedStr, role, alias, branchId, userId]
            );
        } else {
            await dbRun(
                'UPDATE User SET name=?, email=?, role=?, alias=?, branchId=? WHERE id=?',
                [name, email, role, alias, branchId, userId]
            );
        }
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
