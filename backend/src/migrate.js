const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../migrations/001_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('⏳ Running migration against Supabase database...');
    await pool.query(sql);
    console.log('✅ Database migration succeeded and seeded successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.stack || err.message);
  } finally {
    await pool.end();
  }
}

run();
