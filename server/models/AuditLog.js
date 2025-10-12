
const { isUUID } = require('../utils/helpers'); // We'll add this new helper file

class AuditLog {

    constructor(pool) {
        this.pool = pool;
    }

    async findAll(filters = {}, search = '', limit = null, offset = 0) {
        const client = await this.pool.connect();
        try {
            let baseConditions = '1=1';
            const values = [];
            let paramIndex = 1;

            if (filters.user_id) {
                baseConditions += ` AND user_id = $${paramIndex}`;
                values.push(filters.user_id);
                paramIndex++;
            }
            if (filters.action_type) {
                baseConditions += ` AND action_type = $${paramIndex}`;
                values.push(filters.action_type);
                paramIndex++;
            }
            if (filters.entity_type) {
                baseConditions += ` AND entity_type = $${paramIndex}`;
                values.push(filters.entity_type);
                paramIndex++;
            }
            if (filters.entity_id) {
                baseConditions += ` AND entity_id = $${paramIndex}`;
                values.push(filters.entity_id);
                paramIndex++;
            }
            if (filters.start_date) {
                baseConditions += ` AND timestamp >= $${paramIndex}`;
                values.push(filters.start_date);
                paramIndex++;
            }
            if (filters.end_date) {
                baseConditions += ` AND timestamp <= $${paramIndex}`;
                values.push(filters.end_date);
                paramIndex++;
            }

            if (search && typeof search === 'string' && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                baseConditions += ` AND (username ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR details::text ILIKE $${paramIndex} OR ip_address ILIKE $${paramIndex})`;
                values.push(searchTerm);
                paramIndex++;
            }

            const countQuery = `SELECT COUNT(*)::int AS count FROM audit_logs WHERE ${baseConditions};`;
            const countResult = await client.query(countQuery, values);
            const totalCount = parseInt(countResult.rows[0].count, 10);

            let dataQuery = `SELECT * FROM audit_logs WHERE ${baseConditions}`;
            dataQuery += ' ORDER BY timestamp DESC';

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

            console.log('--- AuditLog.findAll SQL Diagnosis ---');
            console.log('Count Query:', countQuery);
            console.log('Data Query:', dataQuery);
            console.log('Query Parameters (values):', values);
            console.log('Effective Search Term:', (search && typeof search === 'string' && search.trim()) ? search.trim() : 'N/A (not applied)');
            console.log('Effective Limit:', safeLimit);
            console.log('Effective Offset:', safeOffset);
            console.log('--------------------------------------');

            const dataResult = await client.query(dataQuery, values);
            return { rows: dataResult.rows, totalCount };
        } catch (error) {
            console.error('Database Error during findAll audit logs:', error.message, error.stack);
            throw new Error(`Error fetching audit logs: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async create(logData) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO audit_logs (
                    user_id, username, action_type, entity_type, entity_id,
                    description, details, ip_address, timestamp, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW(), NOW())
                RETURNING *;
            `;
            // Accept both UUID and VARCHAR entity_ids (for transaction IDs like CHD723998)
            const safeEntityId = logData.entity_id || null;

            const values = [
                logData.user_id || null,
                logData.username || null,
                logData.action_type,
                logData.entity_type || null,
                safeEntityId,
                logData.description || null,
                (logData.details && typeof logData.details !== 'string') ? JSON.stringify(logData.details) : (logData.details || '{}'),
                logData.ip_address || null,
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Database Error during audit log creation:', error.message, error.stack);
            throw new Error(`Error creating audit log: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async del(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM audit_logs WHERE id = $1 RETURNING id;';
            const result = await client.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error(`Database Error during audit log deletion (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error deleting audit log: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async countAllAuditLogs() {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT COUNT(*)::int AS count FROM audit_logs;';
            const result = await client.query(query);
            return result.rows[0].count;
        } catch (error) {
            console.error('Database Error during countAllAuditLogs:', error.message, error.stack);
            throw new Error(`Error counting all audit logs: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = AuditLog;
