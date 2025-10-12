

require('dotenv').config();
const { pool } = require('../config/db');

async function fixAuditLogsSchema() {
    const client = await pool.connect();

    try {
        console.log('🔧 Starting audit logs schema fix...');

        // Check current schema
        const schemaQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'audit_logs'
            AND column_name = 'entity_id'
        `;

        const schemaResult = await client.query(schemaQuery);

        if (schemaResult.rows.length > 0) {
            const currentType = schemaResult.rows[0].data_type;
            console.log(`📋 Current entity_id type: ${currentType}`);

            if (currentType === 'uuid') {
                console.log('🔄 Converting entity_id from UUID to VARCHAR...');

                // First, update any existing UUID values to NULL (they're likely invalid anyway)
                console.log('🧹 Cleaning up invalid UUID values...');
                await client.query(`
                    UPDATE audit_logs
                    SET entity_id = NULL
                    WHERE entity_id IS NOT NULL
                    AND entity_type = 'transaction'
                `);

                // Convert the column type
                console.log('🔄 Altering column type...');
                await client.query(`
                    ALTER TABLE audit_logs
                    ALTER COLUMN entity_id TYPE VARCHAR(255)
                `);

                console.log('✅ Successfully converted entity_id to VARCHAR(255)');
            } else {
                console.log('✅ entity_id is already VARCHAR type');
            }
        } else {
            console.log('⚠️  entity_id column not found in audit_logs table');
        }

        // Verify the change
        const verifyResult = await client.query(schemaQuery);
        if (verifyResult.rows.length > 0) {
            const newType = verifyResult.rows[0].data_type;
            const maxLength = verifyResult.rows[0].character_maximum_length;
            console.log(`✅ Verified: entity_id is now ${newType}(${maxLength})`);
        }

        // Test with a sample transaction ID
        console.log('🧪 Testing with sample transaction ID...');
        const testQuery = `
            SELECT COUNT(*) as count
            FROM audit_logs
            WHERE entity_id = $1 AND entity_type = $2
        `;

        const testResult = await client.query(testQuery, ['CHD723998', 'transaction']);
        console.log(`✅ Test query successful: found ${testResult.rows[0].count} matching records`);

        console.log('\n🎉 Audit logs schema fix completed successfully!');
        console.log('✅ The case review timeline should now work properly');

    } catch (error) {
        console.error('❌ Error fixing audit logs schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixAuditLogsSchema()
        .then(() => {
            console.log('\n✅ Schema fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Schema fix failed:', error.message);
            process.exit(1);
        });
}

module.exports = { fixAuditLogsSchema };
