const express = require('express');
const router = express.Router();
const { dbGet, dbRun } = require('../db');

// Secret identity check — must match all three criteria
async function isDevUser(req, res, next) {
    const requesterId = req.headers['x-user-id'];
    if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await dbGet(`
        SELECT u.*, b.name as branchName 
        FROM User u LEFT JOIN Branch b ON u.branchId = b.id 
        WHERE u.id = ?
    `, [requesterId]);

    const isLegit = (
        user &&
        user.name === 'SidV' &&
        user.alias === 'DEV' &&
        user.branchName === 'RS ONLINE'
    );

    if (!isLegit) return res.status(403).json({ message: 'Forbidden' });

    req.devUser = user;
    next();
}

router.use(isDevUser);

// DELETE /api/dev/wipe/records  — clears all DailyRecord rows
router.delete('/wipe/records', async (req, res) => {
    try {
        await dbRun('DELETE FROM DailyRecord');
        res.json({ message: 'All DailyRecord data wiped.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/dev/wipe/settlements  — clears all DailySettlement rows
router.delete('/wipe/settlements', async (req, res) => {
    try {
        await dbRun('DELETE FROM DailySettlement');
        res.json({ message: 'All DailySettlement data wiped.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/dev/wipe/tasks  — clears all Task rows
router.delete('/wipe/tasks', async (req, res) => {
    try {
        await dbRun('DELETE FROM Task');
        res.json({ message: 'All Task data wiped.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/dev/wipe/all  — full test-data wipe
router.delete('/wipe/all', async (req, res) => {
    try {
        await dbRun('DELETE FROM DailyRecord');
        await dbRun('DELETE FROM DailySettlement');
        await dbRun('DELETE FROM Task');
        res.json({ message: 'All test data wiped successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
