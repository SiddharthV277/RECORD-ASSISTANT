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

// ── GET /api/settlements/summary ──────────────────────────────────────────────
// Returns unsettled records totals + opening balance (last settlement's kept)
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Unsettled records (settlementId IS NULL) — what the next settlement will cover
        const unsettled = await dbGet(`
            SELECT
                COALESCE(SUM(salePrice), 0)  as totalSales,
                COALESCE(SUM(costPrice), 0)  as totalCost,
                COALESCE(SUM(variance), 0)   as totalVariance,
                COUNT(*)                      as recordCount
            FROM DailyRecord
            WHERE userId = ? AND settlementId IS NULL
        `, [userId]);

        // Today's ALL records (for stat cards on the main page)
        const todayAll = await dbGet(`
            SELECT
                COALESCE(SUM(salePrice), 0)  as totalSales,
                COALESCE(SUM(costPrice), 0)  as totalCost,
                COALESCE(SUM(variance), 0)   as totalVariance
            FROM DailyRecord
            WHERE userId = ? AND date = ?
        `, [userId, today]);

        // Opening balance = most recent settlement's keptAmount for this user
        const lastSettlement = await dbGet(
            `SELECT keptAmount, settledAt, date FROM DailySettlement
             WHERE userId = ? ORDER BY settledAt DESC LIMIT 1`,
            [userId]
        );
        const openingBalance = lastSettlement ? parseFloat(lastSettlement.keptAmount) : 0;

        // Admin/superadmin users available as recipients
        const adminUsers = await dbAll(
            `SELECT id, name, role FROM User WHERE role IN ('ADMIN', 'SUPERADMIN') AND id != ? ORDER BY name ASC`,
            [userId]
        );

        res.json({
            date: today,
            // Opening balance = last settlement kept
            openingBalance: parseFloat(openingBalance.toFixed(2)),
            lastSettledAt: lastSettlement?.settledAt || null,

            // Unsettled (what next settlement covers)
            unsettledSales:    parseFloat(unsettled.totalSales.toFixed(2)),
            unsettledCost:     parseFloat(unsettled.totalCost.toFixed(2)),
            unsettledVariance: parseFloat(unsettled.totalVariance.toFixed(2)),
            unsettledCount:    unsettled.recordCount,
            unsettledFunds:    parseFloat((openingBalance + unsettled.totalSales).toFixed(2)),

            // Today's full totals (stat cards)
            totalSales:    parseFloat(todayAll.totalSales.toFixed(2)),
            totalCost:     parseFloat(todayAll.totalCost.toFixed(2)),
            totalVariance: parseFloat(todayAll.totalVariance.toFixed(2)),
            totalFunds:    parseFloat((openingBalance + todayAll.totalSales).toFixed(2)),

            adminUsers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/settlements ─────────────────────────────────────────────────────
// Submit a settlement covering ALL currently unsettled records
router.post('/', async (req, res) => {
    try {
        const { sentAmount1, sentUser1, sentAmount2, sentUser2, remarks } = req.body;
        const userId = req.user.id;
        const now = new Date();
        const settlementDate = now.toISOString().split('T')[0];
        const settledAt = now.toISOString();

        // Get all unsettled records
        const unsettledRecords = await dbAll(
            'SELECT * FROM DailyRecord WHERE userId = ? AND settlementId IS NULL',
            [userId]
        );
        if (unsettledRecords.length === 0) {
            return res.status(400).json({ message: 'No unsettled records to settle' });
        }

        // Validate recipients are admin/superadmin
        if (sentUser1) {
            const u1 = await dbGet('SELECT role FROM User WHERE id = ?', [sentUser1]);
            if (!u1 || (u1.role !== 'ADMIN' && u1.role !== 'SUPERADMIN')) {
                return res.status(400).json({ message: 'Recipient 1 must be an Admin or Superadmin' });
            }
        }
        if (sentUser2) {
            const u2 = await dbGet('SELECT role FROM User WHERE id = ?', [sentUser2]);
            if (!u2 || (u2.role !== 'ADMIN' && u2.role !== 'SUPERADMIN')) {
                return res.status(400).json({ message: 'Recipient 2 must be an Admin or Superadmin' });
            }
        }

        // Calculate totals from unsettled records
        const totalSales    = unsettledRecords.reduce((s, r) => s + r.salePrice, 0);
        const totalCost     = unsettledRecords.reduce((s, r) => s + r.costPrice, 0);
        const totalVariance = unsettledRecords.reduce((s, r) => s + r.variance, 0);

        // Opening balance = most recent settlement's keptAmount
        const lastSettlement = await dbGet(
            `SELECT keptAmount FROM DailySettlement WHERE userId = ? ORDER BY settledAt DESC LIMIT 1`,
            [userId]
        );
        const openingBalance = lastSettlement ? parseFloat(lastSettlement.keptAmount) : 0;

        const totalFunds    = openingBalance + totalSales;
        const sent1         = parseFloat(sentAmount1) || 0;
        const sent2         = parseFloat(sentAmount2) || 0;
        const keptAmount    = parseFloat((totalFunds - sent1 - sent2).toFixed(2));

        // Insert settlement
        const result = await dbRun(`
            INSERT INTO DailySettlement
                (userId, date, settledAt, openingBalance, totalSales, totalCost, totalVariance,
                 sentAmount1, sentUser1, sentAmount2, sentUser2, keptAmount, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, settlementDate, settledAt,
            parseFloat(openingBalance.toFixed(2)),
            parseFloat(totalSales.toFixed(2)),
            parseFloat(totalCost.toFixed(2)),
            parseFloat(totalVariance.toFixed(2)),
            sent1, sentUser1 || null,
            sent2, sentUser2 || null,
            keptAmount,
            remarks || null
        ]);

        const settlementId = result.lastInsertRowid;

        // Mark all unsettled records as covered by this settlement
        for (const r of unsettledRecords) {
            await dbRun('UPDATE DailyRecord SET settlementId = ? WHERE id = ?', [settlementId, r.id]);
        }

        res.status(201).json({
            message: `Settlement #${settlementId} submitted. Covered ${unsettledRecords.length} record(s).`,
            keptAmount,
            settlementId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/settlements/history ──────────────────────────────────────────────
// Current user's own settlement history
router.get('/history', async (req, res) => {
    try {
        const targetUserId = req.user.id;
        const history = await dbAll(`
            SELECT ds.*,
                   u1.name as sentUser1Name, u2.name as sentUser2Name
            FROM DailySettlement ds
            LEFT JOIN User u1 ON ds.sentUser1 = u1.id
            LEFT JOIN User u2 ON ds.sentUser2 = u2.id
            WHERE ds.userId = ?
            ORDER BY ds.settledAt DESC
            LIMIT 60
        `, [targetUserId]);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/settlements/all ──────────────────────────────────────────────────
// Admin/Superadmin: full ledger view with optional filters
router.get('/all', async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const { date, userId } = req.query;
        const where = [];
        const params = [];
        if (date)   { where.push('ds.date = ?');   params.push(date); }
        if (userId) { where.push('ds.userId = ?'); params.push(userId); }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const rows = await dbAll(`
            SELECT
                ds.*,
                sender.name  as senderName,
                sender.role  as senderRole,
                r1.name      as sentUser1Name,
                r1.role      as sentUser1Role,
                r2.name      as sentUser2Name,
                r2.role      as sentUser2Role
            FROM DailySettlement ds
            LEFT JOIN User sender ON ds.userId    = sender.id
            LEFT JOIN User r1     ON ds.sentUser1 = r1.id
            LEFT JOIN User r2     ON ds.sentUser2 = r2.id
            ${whereClause}
            ORDER BY ds.settledAt DESC
            LIMIT 200
        `, params);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/settlements/received ─────────────────────────────────────────────
// Money received BY the logged-in user (pass ?all=1 for admin/superadmin to see all)
router.get('/received', async (req, res) => {
    try {
        const userId  = req.user.id;
        const role    = req.user.role;
        const showAll = (role === 'ADMIN' || role === 'SUPERADMIN') && req.query.all === '1';

        let rows;
        if (showAll) {
            // All transfers where any amount was sent to anyone
            rows = await dbAll(`
                SELECT
                    ds.settledAt, ds.sentAmount1, ds.sentAmount2,
                    ds.sentUser1, ds.sentUser2,
                    sender.name  as senderName,
                    sender.role  as senderRole,
                    r1.name      as recipient1Name,
                    r2.name      as recipient2Name
                FROM DailySettlement ds
                LEFT JOIN User sender ON ds.userId    = sender.id
                LEFT JOIN User r1     ON ds.sentUser1 = r1.id
                LEFT JOIN User r2     ON ds.sentUser2 = r2.id
                WHERE (ds.sentAmount1 > 0 AND ds.sentUser1 IS NOT NULL)
                   OR (ds.sentAmount2 > 0 AND ds.sentUser2 IS NOT NULL)
                ORDER BY ds.settledAt DESC
                LIMIT 100
            `, []);
        } else {
            // One row per transfer where this user is the recipient, non-zero amounts only
            rows = await dbAll(`
                SELECT settledAt, amount, senderName, senderRole FROM (
                    SELECT
                        ds.settledAt,
                        ds.sentAmount1  as amount,
                        sender.name     as senderName,
                        sender.role     as senderRole
                    FROM DailySettlement ds
                    LEFT JOIN User sender ON ds.userId = sender.id
                    WHERE ds.sentUser1 = ? AND ds.sentAmount1 > 0
                    UNION ALL
                    SELECT
                        ds.settledAt,
                        ds.sentAmount2  as amount,
                        sender.name     as senderName,
                        sender.role     as senderRole
                    FROM DailySettlement ds
                    LEFT JOIN User sender ON ds.userId = sender.id
                    WHERE ds.sentUser2 = ? AND ds.sentAmount2 > 0
                ) combined
                ORDER BY settledAt DESC
                LIMIT 60
            `, [userId, userId]);
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/settlements/dashboard-stats ──────────────────────────────────────
// Role-scoped task counts (today / this week / this month) + received money sums
router.get('/dashboard-stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const role   = req.user.role;

        const now   = new Date();
        const today = now.toISOString().split('T')[0];

        // Week start (Monday)
        const dow      = now.getDay(); // 0=sun
        const diffMon  = (dow === 0 ? -6 : 1 - dow);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + diffMon);
        const weekStartISO = weekStart.toISOString().split('T')[0];

        // Month start
        const monthStartISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        // ----- build task WHERE based on role -----
        let taskWhere = '';
        let taskParams = [];

        if (role === 'OPERATOR') {
            taskWhere  = 'WHERE t.assignedTo = ?';
            taskParams = [userId];
        } else if (role === 'ADMIN') {
            // tasks where assignee is in same branch
            taskWhere  = `WHERE EXISTS (
                SELECT 1 FROM User u WHERE u.id = t.assignedTo AND u.branchId = (
                    SELECT branchId FROM User WHERE id = ?
                )
            )`;
            taskParams = [userId];
        }
        // SUPERADMIN: no filter

        const taskBase = `SELECT t.status, t.createdAt FROM Task t ${taskWhere}`;

        const tasks = await dbAll(taskBase, taskParams);

        const counts = { today: {}, week: {}, month: {}, all: {} };
        ['pending','in_review','completed'].forEach(s => {
            counts.today[s] = 0; counts.week[s] = 0;
            counts.month[s]  = 0; counts.all[s]  = 0;
        });

        for (const t of tasks) {
            const s  = t.status;
            const dt = (t.createdAt || '').split('T')[0];
            counts.all[s]++;
            if (dt === today)                   counts.today[s]++;
            if (dt >= weekStartISO)             counts.week[s]++;
            if (dt >= monthStartISO)            counts.month[s]++;
        }

        // ----- per-user breakdown for admin/superadmin -----
        let userBreakdown = [];
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
            const userFilter = role === 'ADMIN'
                ? `WHERE u.branchId = (SELECT branchId FROM User WHERE id = ${userId}) AND u.role = 'OPERATOR'`
                : `WHERE u.role = 'OPERATOR'`;

            userBreakdown = await dbAll(`
                SELECT
                    u.id, u.name,
                    SUM(CASE WHEN t.status = 'pending'   THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN t.status = 'in_review' THEN 1 ELSE 0 END) as in_review,
                    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
                    COUNT(t.id) as total
                FROM User u
                LEFT JOIN Task t ON t.assignedTo = u.id
                ${userFilter}
                GROUP BY u.id
                ORDER BY u.name
            `, []);
        }

        // ----- received money sums for logged-in user -----
        const moneyFilter = role === 'SUPERADMIN'
            ? `` // No restriction
            : `WHERE (ds.sentUser1 = ${userId} OR ds.sentUser2 = ${userId})`;

        // for superadmin: all money sent anywhere
        let receivedToday = 0, receivedWeek = 0, receivedMonth = 0, receivedTotal = 0;

        if (role === 'SUPERADMIN') {
            const rm = await dbGet(`
                SELECT
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) = ? THEN COALESCE(ds.sentAmount1,0)+COALESCE(ds.sentAmount2,0) END), 0) as rToday,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN COALESCE(ds.sentAmount1,0)+COALESCE(ds.sentAmount2,0) END), 0) as rWeek,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN COALESCE(ds.sentAmount1,0)+COALESCE(ds.sentAmount2,0) END), 0) as rMonth,
                    COALESCE(SUM(COALESCE(ds.sentAmount1,0)+COALESCE(ds.sentAmount2,0)), 0) as rTotal
                FROM DailySettlement ds
            `, [today, weekStartISO, monthStartISO]);
            receivedToday = rm.rToday; receivedWeek = rm.rWeek;
            receivedMonth  = rm.rMonth; receivedTotal = rm.rTotal;
        } else {
            const rm1 = await dbGet(`
                SELECT
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) = ? THEN ds.sentAmount1 END), 0) as rToday,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN ds.sentAmount1 END), 0) as rWeek,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN ds.sentAmount1 END), 0) as rMonth,
                    COALESCE(SUM(ds.sentAmount1), 0) as rTotal
                FROM DailySettlement ds WHERE ds.sentUser1 = ?
            `, [today, weekStartISO, monthStartISO, userId]);

            const rm2 = await dbGet(`
                SELECT
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) = ? THEN ds.sentAmount2 END), 0) as rToday,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN ds.sentAmount2 END), 0) as rWeek,
                    COALESCE(SUM(CASE WHEN date(ds.settledAt) >= ? THEN ds.sentAmount2 END), 0) as rMonth,
                    COALESCE(SUM(ds.sentAmount2), 0) as rTotal
                FROM DailySettlement ds WHERE ds.sentUser2 = ?
            `, [today, weekStartISO, monthStartISO, userId]);

            receivedToday = (rm1.rToday || 0) + (rm2.rToday || 0);
            receivedWeek  = (rm1.rWeek  || 0) + (rm2.rWeek  || 0);
            receivedMonth = (rm1.rMonth || 0) + (rm2.rMonth || 0);
            receivedTotal = (rm1.rTotal || 0) + (rm2.rTotal || 0);
        }

        res.json({
            role,
            counts,          // { today, week, month, all } each with pending/in_review/completed
            userBreakdown,   // [] for operators
            received: { today: receivedToday, week: receivedWeek, month: receivedMonth, total: receivedTotal }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
