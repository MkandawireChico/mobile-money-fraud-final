

const format = require('pg-format');

class Rule {

    constructor(pool) {
        this.pool = pool;
    }

    async findAll(filters = {}, search = '', limit = null, offset = 0) {
        const client = await this.pool.connect();
        try {
            let baseConditions = '1=1'; // Start with a true condition to easily append AND clauses
            const values = [];
            let paramIndex = 1; // Counter for SQL query parameters ($1, $2, etc.)

            if (filters.rule_type) {
                baseConditions += ` AND rule_type = $${paramIndex}`;
                values.push(filters.rule_type);
                paramIndex++;
            }
            if (filters.severity) {
                baseConditions += ` AND severity = $${paramIndex}`;
                values.push(filters.severity);
                paramIndex++;
            }
            if (filters.status) { // Changed from is_active to status for consistency with schema
                baseConditions += ` AND status = $${paramIndex}`;
                values.push(filters.status);
                paramIndex++;
            }

            if (search && typeof search === 'string' && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                baseConditions += ` AND (rule_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
                values.push(searchTerm);
                paramIndex++;
            }

            // First, get the total count of records matching the filters
            const countQuery = `SELECT COUNT(*)::int AS count FROM rules WHERE ${baseConditions};`;
            const countResult = await client.query(countQuery, values);
            const totalCount = parseInt(countResult.rows[0].count, 10);

            // Then, fetch the actual data with ordering and pagination
            let dataQuery = `SELECT * FROM rules WHERE ${baseConditions}`;
            dataQuery += ' ORDER BY created_at DESC'; // Order by creation date (most recent first)

            const safeLimit = (typeof limit === 'number' && limit > 0) ? limit : null;
            const safeOffset = (typeof offset === 'number' && offset >= 0) ? offset : 0;

            if (safeLimit !== null) {
                dataQuery += ` LIMIT $${paramIndex}`;
                values.push(safeLimit);
                paramIndex++;
                dataQuery += ` OFFSET $${paramIndex}`;
                values.push(safeOffset);
                paramIndex++;
            }
            dataQuery += ';';

            // Log the constructed queries and parameters for debugging
            console.log('--- Rule.findAll SQL Diagnosis ---');
            console.log('Count Query:', countQuery);
            console.log('Data Query:', dataQuery);
            console.log('Query Parameters (values):', values);
            console.log('Effective Limit:', safeLimit);
            console.log('Effective Offset:', safeOffset);
            console.log('--------------------------------------');

            const dataResult = await client.query(dataQuery, values);
            return { rows: dataResult.rows, totalCount };
        } catch (error) {
            console.error('Database Error during findAll rules:', error.message, error.stack);
            throw new Error(`Error fetching rules: ${error.message}`);
        } finally {
            client.release(); // Always release the client back to the pool
        }
    }

    async findByName(ruleName) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM rules WHERE rule_name = $1;';
            const result = await client.query(query, [ruleName]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Database Error during findByName rule:', error.message, error.stack);
            throw new Error(`Error finding rule by name: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async create(ruleData) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO rules (
                    rule_name, description, criteria, action_type, severity, status,
                    created_by, last_modified_by, created_at, updated_at
                )
                VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING *;
            `;
            // Ensure criteria is stringified if it's an object, otherwise use provided value or empty object JSON string
            const criteriaJson = (ruleData.criteria && typeof ruleData.criteria === 'object') ? JSON.stringify(ruleData.criteria) : (ruleData.criteria || '{}');

            const values = [
                ruleData.rule_name,
                ruleData.description || null,
                criteriaJson,
                ruleData.action_type,
                ruleData.severity,
                ruleData.status || 'active', // Default status to 'active'
                ruleData.created_by || null, // Set created_by, assuming it comes from authenticated user
                ruleData.last_modified_by || null, // Set last_modified_by, assuming it comes from authenticated user
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Database Error during rule creation:', error.message, error.stack);
            throw new Error(`Error creating rule: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM rules WHERE id = $1;';
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Database Error during findById rule:', error.message, error.stack);
            throw new Error(`Error finding rule by ID: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async update(id, updateData) {
        const client = await this.pool.connect();
        try {
            const fields = [];
            const values = [id]; // $1 will always be the ID
            let paramIndex = 2; // Start parameter index from $2 for update fields

            // Dynamically build the SET clause based on provided updateData
            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {

                    if (key === 'criteria') {
                        fields.push(`${key} = $${paramIndex}::jsonb`);
                        values.push(typeof updateData[key] === 'object' ? JSON.stringify(updateData[key]) : updateData[key]);
                    } else {
                        fields.push(`${key} = $${paramIndex}`);
                        values.push(updateData[key]);
                    }
                    paramIndex++;
                }
            }

            // Always update the `updated_at` timestamp
            fields.push(`updated_at = NOW()`);

            // If no fields were provided for update (other than implicit updated_at),
            // fetch and return the existing rule to indicate no effective change.
            if (fields.length === 1 && fields[0].includes('updated_at')) {
                const existingRule = await this.findById(id);
                return existingRule;
            }

            const query = `
                UPDATE rules
                SET ${fields.join(', ')}
                WHERE id = $1
                RETURNING *;
            `;

            const result = await client.query(query, values);
            return result.rows[0] || null; // Return the updated rule or null if not found/updated
        } catch (error) {
            console.error(`Database Error during rule update (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error updating rule: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async del(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM rules WHERE id = $1 RETURNING id;';
            const result = await client.query(query, [id]);
            return result.rowCount > 0; // Returns true if a row was deleted, false otherwise
        } catch (error) {
            console.error(`Database Error during rule deletion (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error deleting rule: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = Rule;
