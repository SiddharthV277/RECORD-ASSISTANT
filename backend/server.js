const express = require('express');
const cors = require('cors');
const { db, dbAll } = require('./db.js');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const particularRoutes = require('./routes/particulars');
const recordRoutes = require('./routes/records');
const settlementRoutes = require('./routes/settlements');
const devRoutes = require('./routes/dev');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/particulars', particularRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dev', devRoutes);

// Utility route to fetch branches for frontend forms
app.get('/api/branches', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM Branch');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
