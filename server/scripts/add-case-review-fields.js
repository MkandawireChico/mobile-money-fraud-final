

require('dotenv').config(); // Load environment variables
const { pool } = require('../config/db');

async function addCaseReviewFields() {
    const client = await pool.connect();

    try {
        console.log('🔧 Starting case review fields migration...');

        // Check if fields already exist
        const checkQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'transactions'
            AND column_name IN ('case_status', 'reviewed_by', 'investigation_notes')
        `;

        const existingFields = await client.query(checkQuery);

        if (existingFields.rows.length > 0) {
            console.log('⚠️  Case review fields already exist. Checking for missing fields...');

            const existingFieldNames = existingFields.rows.map(row => row.column_name);
            const requiredFields = ['case_status', 'reviewed_by', 'investigation_notes'];
            const missingFields = requiredFields.filter(field => !existingFieldNames.includes(field));

            if (missingFields.length === 0) {
                console.log('✅ All case review fields already exist. Migration not needed.');
                return;
            }

            console.log(`📝 Adding missing fields: ${missingFields.join(', ')}`);
        }

        // Add case review fields
        const alterTableQuery = `
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS case_status VARCHAR(50) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS investigation_notes TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS fraud_confirmed_at TIMESTAMP DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS fraud_cleared_at TIMESTAMP DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS notes_updated_by VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMP DEFAULT NULL
        `;

        await client.query(alterTableQuery);
        console.log('✅ Successfully added case review fields to transactions table');

        // Create indexes for better performance
        const indexQueries = [
            'CREATE INDEX IF NOT EXISTS idx_transactions_case_status ON transactions (case_status)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_reviewed_by ON transactions (reviewed_by)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_reviewed_at ON transactions (reviewed_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_fraud_confirmed_at ON transactions (fraud_confirmed_at DESC)'
        ];

        for (const indexQuery of indexQueries) {
            await client.query(indexQuery);
        }

        console.log('✅ Successfully created indexes for case review fields');

        // Add check constraint for case_status values (with existence check)
        try {
            // Check if constraint already exists
            const constraintExists = await client.query(`
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name = 'transactions'
                AND constraint_name = 'chk_case_status'
            `);

            if (constraintExists.rows.length === 0) {
                const constraintQuery = `
                    ALTER TABLE transactions
                    ADD CONSTRAINT chk_case_status
                    CHECK (case_status IS NULL OR case_status IN ('confirm_fraud', 'mark_legitimate', 'needs_review'))
                `;

                await client.query(constraintQuery);
                console.log('✅ Successfully added check constraint for case_status');
            } else {
                console.log('✅ Check constraint for case_status already exists');
            }
        } catch (constraintError) {
            console.log('⚠️  Could not add check constraint (this is optional):', constraintError.message);
        }

        // Verify the changes
        const verifyQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'transactions'
            AND column_name IN (
                'case_status', 'reviewed_by', 'reviewed_at', 'investigation_notes',
                'fraud_confirmed_at', 'fraud_cleared_at', 'notes_updated_by', 'notes_updated_at'
            )
            ORDER BY column_name
        `;

        const verification = await client.query(verifyQuery);

        console.log('\n📋 Case Review Fields Added:');
        console.log('┌─────────────────────┬──────────────────┬─────────────┬─────────────────┐');
        console.log('│ Field Name          │ Data Type        │ Nullable    │ Default         │');
        console.log('├─────────────────────┼──────────────────┼─────────────┼─────────────────┤');

        verification.rows.forEach(row => {
            const fieldName = row.column_name.padEnd(19);
            const dataType = row.data_type.padEnd(16);
            const nullable = row.is_nullable.padEnd(11);
            const defaultValue = (row.column_default || 'NULL').padEnd(15);
            console.log(`│ ${fieldName} │ ${dataType} │ ${nullable} │ ${defaultValue} │`);
        });

        console.log('└─────────────────────┴──────────────────┴─────────────┴─────────────────┘');

        console.log('\n🎉 Case review fields migration completed successfully!');
        console.log('\n📝 New Capabilities:');
        console.log('   • Track fraud case investigation status');
        console.log('   • Record analyst decisions and timestamps');
        console.log('   • Store investigation notes and evidence');
        console.log('   • Maintain complete audit trail of case reviews');

    } catch (error) {
        console.error('❌ Error adding case review fields:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    addCaseReviewFields()
        .then(() => {
            console.log('\n✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error.message);
            process.exit(1);
        });
}

module.exports = { addCaseReviewFields };
