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

// GET /api/records?date=YYYY-MM-DD&userId=X
// Users see only their own. Admin/Superadmin can specify userId
router.get('/', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        let targetUserId = req.user.id;

        if ((req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') && req.query.userId) {
            targetUserId = req.query.userId;
        }

        const records = await dbAll(`
            SELECT dr.*, p.name as particularName
            FROM DailyRecord dr
            LEFT JOIN Particular p ON dr.particularId = p.id
            WHERE dr.userId = ? AND dr.date = ?
            ORDER BY dr.id ASC
        `, [targetUserId, date]);

        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/records - add a record entry
router.post('/', async (req, res) => {
    try {
        const { particularId, quantity, salePrice, date } = req.body;
        const recordDate = date || new Date().toISOString().split('T')[0];

        if (!particularId || salePrice == null || salePrice === '') {
            return res.status(400).json({ message: 'particularId and salePrice are required' });
        }

        const particular = await dbGet('SELECT * FROM Particular WHERE id = ?', [particularId]);
        if (!particular) return res.status(404).json({ message: 'Particular not found' });

        const qty = parseInt(quantity) || 1;
        const cost = parseFloat((particular.costPrice * qty).toFixed(2));
        const sale = parseFloat(parseFloat(salePrice).toFixed(2));
        const variance = parseFloat((sale - cost).toFixed(2));

        await dbRun(
            'INSERT INTO DailyRecord (userId, date, particularId, quantity, salePrice, costPrice, variance) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, recordDate, particularId, qty, sale, cost, variance]
        );

        res.status(201).json({ message: 'Record added', costPrice: cost, variance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/records/:id - user can delete their own record for today only
router.delete('/:id', async (req, res) => {
    try {
        const record = await dbGet('SELECT * FROM DailyRecord WHERE id = ?', [req.params.id]);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Check ownership or admin
        if (record.userId !== req.user.id && req.user.role === 'OPERATOR') {
            return res.status(403).json({ message: 'Cannot delete other user records' });
        }

        const today = new Date().toISOString().split('T')[0];
        if (record.date !== today && req.user.role === 'OPERATOR') {
            return res.status(403).json({ message: 'Can only delete records from today' });
        }

        await dbRun('DELETE FROM DailyRecord WHERE id = ?', [req.params.id]);
        res.json({ message: 'Record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
