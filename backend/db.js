const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new DatabaseSync(dbPath);

console.log('Connected to node:sqlite database.');

function initializeDB() {
    // Create Branch Table
    db.exec(`CREATE TABLE IF NOT EXISTS Branch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        location TEXT
    )`);

    // Create User Table
    db.exec(`CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        alias TEXT,
        branchId INTEGER,
        FOREIGN KEY (branchId) REFERENCES Branch (id)
    )`);

    // Create Task Table
    db.exec(`CREATE TABLE IF NOT EXISTS Task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        assignedBy INTEGER,
        assignedTo INTEGER,
        FOREIGN KEY (assignedBy) REFERENCES User (id),
        FOREIGN KEY (assignedTo) REFERENCES User (id)
    )`);

    // Create Particular Table
    db.exec(`CREATE TABLE IF NOT EXISTS Particular (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        costPrice REAL DEFAULT 0.0
    )`);

    // Create DailyRecord Table
    db.exec(`CREATE TABLE IF NOT EXISTS DailyRecord (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        date TEXT,
        particularId INTEGER,
        quantity INTEGER DEFAULT 1,
        salePrice REAL DEFAULT 0.0,
        costPrice REAL DEFAULT 0.0,
        variance REAL DEFAULT 0.0,
        FOREIGN KEY (userId) REFERENCES User (id),
        FOREIGN KEY (particularId) REFERENCES Particular (id)
    )`);

    // Create DailySettlement Table
    db.exec(`CREATE TABLE IF NOT EXISTS DailySettlement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        date TEXT,
        openingBalance REAL DEFAULT 0.0,
        totalSales REAL DEFAULT 0.0,
        totalCost REAL DEFAULT 0.0,
        totalVariance REAL DEFAULT 0.0,
        sentAmount1 REAL DEFAULT 0.0,
        sentUser1 INTEGER,
        sentAmount2 REAL DEFAULT 0.0,
        sentUser2 INTEGER,
        keptAmount REAL DEFAULT 0.0,
        remarks TEXT,
        FOREIGN KEY (userId) REFERENCES User (id),
        FOREIGN KEY (sentUser1) REFERENCES User (id),
        FOREIGN KEY (sentUser2) REFERENCES User (id)
    )`);

    seedInitialData();
}

function seedInitialData() {
    const branches = [
        'MAIN BRANCH', 'BRANCH_A', 'BRANCH_B', 'BRANCH_C', 'BRANCH_D', 
        'BRANCH_E', 'BRANCH_F', 'BRANCH_G', 'BRANCH_H', 'BRANCH_I'
    ];

    const branchCount = db.prepare('SELECT COUNT(*) as count FROM Branch').get().count;
    
    if (branchCount === 0) {
        const stmt = db.prepare('INSERT INTO Branch (name, location) VALUES (?, ?)');
        branches.forEach(b => {
             stmt.run(b, 'HQ');
        });
        console.log('Seeded defined branches.');
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM User').get().count;
    if (userCount === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const branchRow = db.prepare('SELECT id FROM Branch WHERE name = ?').get('MAIN BRANCH');
        const branchId = branchRow ? branchRow.id : 1;
        
        db.prepare(`INSERT INTO User (name, email, password, role, alias, branchId) 
                VALUES ('System Admin', 'admin@example.local', ?, 'SUPERADMIN', 'dev', ?)`).run(hashedPassword, branchId);
        
        console.log('Seeded superadmin account (admin@example.local / admin123).');
    }
}

function migrateDB() {
    // Migration 1: Add settlementId to DailyRecord (links record to which settlement paid it)
    const drCols = db.prepare('PRAGMA table_info(DailyRecord)').all();
    if (!drCols.find(c => c.name === 'settlementId')) {
        db.exec('ALTER TABLE DailyRecord ADD COLUMN settlementId INTEGER');
        console.log('Migration: Added settlementId to DailyRecord.');
    }

    // Migration 2: Add settledAt + remove unique(userId,date) constraint on DailySettlement
    // SQLite cannot drop constraints, so we recreate the table
    const dsCols = db.prepare('PRAGMA table_info(DailySettlement)').all();
    if (!dsCols.find(c => c.name === 'settledAt')) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS DailySettlement_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                date TEXT,
                settledAt TEXT,
                openingBalance REAL DEFAULT 0.0,
                totalSales REAL DEFAULT 0.0,
                totalCost REAL DEFAULT 0.0,
                totalVariance REAL DEFAULT 0.0,
                sentAmount1 REAL DEFAULT 0.0,
                sentUser1 INTEGER,
                sentAmount2 REAL DEFAULT 0.0,
                sentUser2 INTEGER,
                keptAmount REAL DEFAULT 0.0,
                remarks TEXT,
                FOREIGN KEY (userId) REFERENCES User (id),
                FOREIGN KEY (sentUser1) REFERENCES User (id),
                FOREIGN KEY (sentUser2) REFERENCES User (id)
            )
        `);
        db.exec(`
            INSERT INTO DailySettlement_v2
                (id, userId, date, settledAt, openingBalance, totalSales, totalCost,
                 totalVariance, sentAmount1, sentUser1, sentAmount2, sentUser2, keptAmount, remarks)
            SELECT id, userId, date, date || 'T23:59:00.000Z',
                   openingBalance, totalSales, totalCost, totalVariance,
                   sentAmount1, sentUser1, sentAmount2, sentUser2, keptAmount, remarks
            FROM DailySettlement
        `);
        db.exec('DROP TABLE DailySettlement');
        db.exec('ALTER TABLE DailySettlement_v2 RENAME TO DailySettlement');
        console.log('Migration: Recreated DailySettlement with settledAt, multiple-per-day allowed.');
    }
}

// Run init + migrations
initializeDB();
migrateDB();
migrateDB3();

function migrateDB3() {
    // Migration 3: Add createdAt to Task
    const taskCols = db.prepare('PRAGMA table_info(Task)').all();
    if (!taskCols.find(c => c.name === 'createdAt')) {
        const today = new Date().toISOString();
        db.exec(`ALTER TABLE Task ADD COLUMN createdAt TEXT DEFAULT '${today}'`);
        console.log('Migration: Added createdAt to Task table.');
    }
}



// Utility wrappers for async DB queries so we don't need to rewrite all our route logic
const dbRun = async (query, params = []) => {
    return db.prepare(query).run(...params);
};

const dbAll = async (query, params = []) => {
    return db.prepare(query).all(...params);
};

const dbGet = async (query, params = []) => {
    return db.prepare(query).get(...params);
};

module.exports = { db, dbRun, dbAll, dbGet };
