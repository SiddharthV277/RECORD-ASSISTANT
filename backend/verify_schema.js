const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const db = new DatabaseSync(path.join(__dirname, 'database.db'));

function checkSchema() {
    const dr = db.prepare('PRAGMA table_info(DailyRecord)').all();
    const ds = db.prepare('PRAGMA table_info(DailySettlement)').all();
    
    console.log('--- DailyRecord Columns ---');
    dr.forEach(c => console.log(`${c.name} (${c.type})`));
    
    console.log('\n--- DailySettlement Columns ---');
    ds.forEach(c => console.log(`${c.name} (${c.type})`));
}

checkSchema();
