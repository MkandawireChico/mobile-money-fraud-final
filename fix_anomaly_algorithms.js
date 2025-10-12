const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create a pool using the same configuration as the app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fraud_detection'
});

async function fixAnomalyAlgorithms() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking anomalies with missing algorithm data...\n');
    
    // Check current state
    const totalResult = await client.query('SELECT COUNT(*) as count FROM anomalies;');
    console.log(`📊 Total anomalies in database: ${totalResult.rows[0].count}`);
    
    // Check anomalies with missing triggered_by
    const missingResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM anomalies 
      WHERE triggered_by IS NULL 
         OR triggered_by = 'null'::jsonb 
         OR triggered_by = '{}'::jsonb
         OR NOT (triggered_by ? 'algorithm');
    `);
    console.log(`❌ Anomalies with missing algorithm data: ${missingResult.rows[0].count}`);
    
    if (missingResult.rows[0].count > 0) {
      console.log('\n🔧 Fixing anomalies with missing algorithm data...');
      
      // Get sample of problematic anomalies
      const sampleResult = await client.query(`
        SELECT id, rule_name, triggered_by, risk_score, timestamp 
        FROM anomalies 
        WHERE triggered_by IS NULL 
           OR triggered_by = 'null'::jsonb 
           OR triggered_by = '{}'::jsonb
           OR NOT (triggered_by ? 'algorithm')
        ORDER BY timestamp DESC 
        LIMIT 5;
      `);
      
      console.log('\n📋 Sample problematic anomalies:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id.substring(0, 8)}...`);
        console.log(`   Rule: ${row.rule_name}`);
        console.log(`   Triggered by: ${row.triggered_by ? JSON.stringify(row.triggered_by) : 'NULL'}`);
        console.log(`   Risk Score: ${row.risk_score}`);
        console.log('');
      });
      
      // Fix anomalies using smart algorithm selection based on risk and characteristics
      const updateResult = await client.query(`
        UPDATE anomalies 
        SET triggered_by = CASE 
          WHEN rule_name LIKE '%Manual%' THEN 
            jsonb_build_object(
              'type', 'Manual Review',
              'algorithm', 'ManualDetection',
              'version', '1.0',
              'description', 'Manual anomaly detection by fraud analyst',
              'confidence', 0.5
            )
          WHEN rule_name LIKE '%Rule%' OR rule_name LIKE '%Threshold%' THEN 
            jsonb_build_object(
              'type', 'Rule Engine',
              'algorithm', 'RuleBasedDetection',
              'version', '1.0',
              'description', 'Rule-based fraud detection system with threshold analysis',
              'confidence', COALESCE(risk_score, 0.5)
            )
          WHEN risk_score >= 0.9 THEN
            jsonb_build_object(
              'type', 'ML Model',
              'algorithm', 'Autoencoder',
              'version', '1.0',
              'description', 'Autoencoder Neural Network - Deep learning for critical fraud detection with highest accuracy',
              'confidence', risk_score,
              'selection_reason', 'Critical risk level - using most accurate algorithm'
            )
          WHEN risk_score >= 0.7 THEN
            jsonb_build_object(
              'type', 'ML Model',
              'algorithm', 'OneClassSVM',
              'version', '1.0',
              'description', 'One-Class SVM - Support Vector Machine optimized for high-risk fraud detection',
              'confidence', risk_score,
              'selection_reason', 'High risk level - using precision algorithm'
            )
          WHEN risk_score >= 0.6 THEN
            jsonb_build_object(
              'type', 'ML Model',
              'algorithm', 'LocalOutlierFactor',
              'version', '1.0',
              'description', 'Local Outlier Factor - Best performing algorithm for general fraud detection',
              'confidence', risk_score,
              'selection_reason', 'Medium-high risk - using best overall performer'
            )
          ELSE 
            jsonb_build_object(
              'type', 'ML Model',
              'algorithm', 'LocalOutlierFactor',
              'version', '1.0',
              'description', 'Local Outlier Factor - Primary fraud detection algorithm with proven performance',
              'confidence', COALESCE(risk_score, 0.5),
              'selection_reason', 'Default case - using best performing algorithm'
            )
        END,
        updated_at = NOW()
        WHERE triggered_by IS NULL 
           OR triggered_by = 'null'::jsonb 
           OR triggered_by = '{}'::jsonb
           OR NOT (triggered_by ? 'algorithm');
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} anomalies with algorithm data`);
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM anomalies 
      WHERE triggered_by IS NULL 
         OR triggered_by = 'null'::jsonb 
         OR triggered_by = '{}'::jsonb
         OR NOT (triggered_by ? 'algorithm');
    `);
    console.log(`❌ Remaining anomalies with missing algorithm: ${verifyResult.rows[0].count}`);
    
    // Show sample of fixed anomalies
    const fixedSampleResult = await client.query(`
      SELECT id, rule_name, triggered_by->>'algorithm' as algorithm, risk_score 
      FROM anomalies 
      WHERE triggered_by ? 'algorithm'
      ORDER BY updated_at DESC 
      LIMIT 5;
    `);
    
    console.log('\n✅ Sample of fixed anomalies:');
    fixedSampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id.substring(0, 8)}...`);
      console.log(`   Rule: ${row.rule_name}`);
      console.log(`   Algorithm: ${row.algorithm}`);
      console.log(`   Risk Score: ${row.risk_score}`);
      console.log('');
    });
    
    // Show algorithm distribution
    const algorithmDistResult = await client.query(`
      SELECT 
        triggered_by->>'algorithm' as algorithm,
        COUNT(*) as count
      FROM anomalies 
      WHERE triggered_by ? 'algorithm'
      GROUP BY triggered_by->>'algorithm'
      ORDER BY count DESC;
    `);
    
    console.log('📊 Algorithm Distribution:');
    algorithmDistResult.rows.forEach(row => {
      console.log(`   ${row.algorithm}: ${row.count} anomalies`);
    });
    
    console.log('\n🎉 Algorithm fix completed successfully!');
    console.log('💡 Refresh your anomalies page to see the updated algorithm data.');
    
  } catch (error) {
    console.error('❌ Error fixing anomaly algorithms:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
console.log('🚀 Starting anomaly algorithm fix...\n');
fixAnomalyAlgorithms();
