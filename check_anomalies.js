const { Pool } = require('pg');
require('dotenv').config();

// Create a pool using the same configuration as the app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fraud_detection'
});

async function checkAnomalies() {
  try {
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM anomalies;');
    console.log('Total anomalies in database:', countResult.rows[0].count);
    
    // Get sample anomalies
    const sampleResult = await pool.query('SELECT id, triggered_by, timestamp, description FROM anomalies ORDER BY timestamp DESC LIMIT 10;');
    console.log('\nSample anomalies:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Triggered by: ${row.triggered_by ? JSON.stringify(row.triggered_by) : 'NULL'}`);
      console.log(`   Timestamp: ${row.timestamp}`);
      console.log(`   Description: ${row.description}`);
      console.log('');
    });
    
    // Check for anomalies with missing triggered_by
    const missingTriggerResult = await pool.query("SELECT COUNT(*) as count FROM anomalies WHERE triggered_by IS NULL OR triggered_by = 'null' OR triggered_by = '{}';");
    console.log('Anomalies with missing triggered_by:', missingTriggerResult.rows[0].count);
    
  } catch (error) {
    console.error('Error checking anomalies:', error.message);
  } finally {
    await pool.end();
  }
}

checkAnomalies();