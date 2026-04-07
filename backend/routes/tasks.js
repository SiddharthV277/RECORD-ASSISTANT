const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../db');

// Same strict pseudo-auth check
async function getRequester(req, res, next) {
    const requesterId = req.headers['x-user-id'] || req.query.requesterId;
    if (!requesterId) return res.status(401).json({ message: 'Missing user context' });
    
    const user = await dbGet('SELECT * FROM User WHERE id = ?', [requesterId]);
    if (!user) return res.status(404).json({ message: 'Requester not found' });
    
    req.user = user;
    next();
}

router.use(getRequester);

// GET /api/tasks
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT t.*, u1.name as assignedByName, u2.name as assignedToName, 
            u2.branchId as taskBranchId, b.name as branchName
            FROM Task t
            LEFT JOIN User u1 ON t.assignedBy = u1.id
            LEFT JOIN User u2 ON t.assignedTo = u2.id
            LEFT JOIN Branch b ON u2.branchId = b.id
        `;
        let params = [];

        if (req.user.role === 'SUPERADMIN') {
            // Can see all tasks
            const tasks = await dbAll(query + ' ORDER BY t.id DESC', params);
            return res.json(tasks);
        } else if (req.user.role === 'ADMIN') {
            // Can see tasks involving users in their branch
            query += ' WHERE u2.branchId = ? OR u1.branchId = ? ORDER BY t.id DESC';
            params.push(req.user.branchId, req.user.branchId);
            const tasks = await dbAll(query, params);
            return res.json(tasks);
        } else {
            // OPERATOR gets only assigned tasks
            query += ' WHERE t.assignedTo = ? ORDER BY t.id DESC';
            params.push(req.user.id);
            const tasks = await dbAll(query, params);
            return res.json(tasks);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tasks
router.post('/', async (req, res) => {
    if (req.user.role === 'OPERATOR') return res.status(403).json({ message: 'Operators cannot assign tasks' });

    try {
        const { title, description, assignedTo } = req.body;
        
        // Admin restriction: can only assign within branch
        if (req.user.role === 'ADMIN') {
            const assignee = await dbGet('SELECT branchId FROM User WHERE id = ?', [assignedTo]);
            if (!assignee || assignee.branchId !== req.user.branchId) {
                return res.status(403).json({ message: 'Admins can only assign within their branch' });
            }
        }

        await dbRun(
            'INSERT INTO Task (title, description, status, assignedBy, assignedTo, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, 'pending', req.user.id, assignedTo, new Date().toISOString()]
        );
        res.status(201).json({ message: 'Task created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/tasks/:id/status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // 'pending', 'in_review', 'completed'
        const taskId = req.params.id;

        const task = await dbGet('SELECT * FROM Task WHERE id = ?', [taskId]);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (req.user.role === 'OPERATOR') {
            // Operator restrictions
            if (task.assignedTo !== req.user.id) return res.status(403).json({ message: 'Not your task' });
            if (status !== 'in_review') return res.status(403).json({ message: 'Operators can only set status to in_review (Check)' });
            
            await dbRun('UPDATE Task SET status = ? WHERE id = ?', ['in_review', taskId]);
            return res.json({ message: 'Task submitted for review' });
        } 
        
        if (req.user.role === 'ADMIN') {
            // Admin must be verifying task within branch
            // For simplicity, we assume if they can see it they can mark it verified, but let's strictly check:
            const assignee = await dbGet('SELECT branchId FROM User WHERE id = ?', [task.assignedTo]);
            if (assignee && assignee.branchId !== req.user.branchId) {
                return res.status(403).json({ message: 'Cannot manage tasks outside your branch' });
            }
            if (status !== 'completed' && status !== 'pending') return res.status(400).json({ message: 'Invalid status' });
            
            await dbRun('UPDATE Task SET status = ? WHERE id = ?', [status, taskId]);
            return res.json({ message: 'Task updated' });
        }

        if (req.user.role === 'SUPERADMIN') {
            // Superadmin has full control
            await dbRun('UPDATE Task SET status = ? WHERE id = ?', [status, taskId]);
            return res.json({ message: 'Task updated' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tasks/:id (Only SuperAdmin or Admin in certain cases, but blueprint says NO editing/deleting for tasks except Superadmin can)
router.delete('/:id', async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') return res.status(403).json({ message: 'Only Superadmin can delete tasks' });

    try {
        await dbRun('DELETE FROM Task WHERE id = ?', [req.params.id]);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
