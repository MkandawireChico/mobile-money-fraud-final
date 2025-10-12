

class Anomaly {

    constructor(pool) {
        this.pool = pool;
        this.tableName = 'anomalies';
    }

    _formatAnomalyData(anomaly) {
        if (!anomaly) return null;

        const formattedAnomaly = { ...anomaly };

        if (formattedAnomaly.comments === null || typeof formattedAnomaly.comments !== 'object' || !Array.isArray(formattedAnomaly.comments)) {
            formattedAnomaly.comments = [];
        }

        if (typeof formattedAnomaly.transaction_data === 'string') {
            try {
                formattedAnomaly.transaction_data = JSON.parse(formattedAnomaly.transaction_data);
            } catch (e) {
                console.warn(`[AnomalyModel] Failed to parse transaction_data for anomaly ${formattedAnomaly.id}:`, e.message);
                formattedAnomaly.transaction_data = {};
            }
        } else if (formattedAnomaly.transaction_data === null) {
            formattedAnomaly.transaction_data = {};
        }

        if (typeof formattedAnomaly.triggered_by === 'string') {
            try {
                formattedAnomaly.triggered_by = JSON.parse(formattedAnomaly.triggered_by);
            } catch (e) {
                console.warn(`[AnomalyModel] Failed to parse triggered_by for anomaly ${formattedAnomaly.id}:`, e.message);
                formattedAnomaly.triggered_by = {};
            }
        } else if (formattedAnomaly.triggered_by === null) {
            formattedAnomaly.triggered_by = {};
        }

        return formattedAnomaly;
    }

    async findAll(filters = {}, search = '', limit = null, offset = 0) {
        const client = await this.pool.connect();
        try {
            let baseConditions = '1=1';
            const values = [];
            let paramIndex = 1;

            if (filters.status) {
                baseConditions += ` AND status = $${paramIndex}`;
                values.push(filters.status);
                paramIndex++;
            }
            if (typeof filters.min_risk_score === 'number') {
                baseConditions += ` AND risk_score >= $${paramIndex}`;
                values.push(filters.min_risk_score);
                paramIndex++;
            }
            if (typeof filters.max_risk_score === 'number') {
                baseConditions += ` AND risk_score <= $${paramIndex}`;
                values.push(filters.max_risk_score);
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
            if (filters.algorithm) {
                // Filter by algorithm in the triggered_by JSON field
                baseConditions += ` AND triggered_by->>'algorithm' = $${paramIndex}`;
                values.push(filters.algorithm);
                paramIndex++;
            }
            if (search && typeof search === 'string' && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                baseConditions += ` AND (description ILIKE $${paramIndex} OR transaction_id::text ILIKE $${paramIndex})`;
                values.push(searchTerm);
                paramIndex++;
            }

            const countQuery = `SELECT COUNT(*)::int AS count FROM ${this.tableName} WHERE ${baseConditions};`;
            const countResult = await client.query(countQuery, values);
            const totalCount = parseInt(countResult.rows[0].count, 10);

            let dataQuery = `SELECT * FROM ${this.tableName} WHERE ${baseConditions} ORDER BY timestamp DESC`;
            const safeLimit = (typeof limit === 'number' && limit > 0) ? limit : null;
            const safeOffset = (typeof offset === 'number' && offset >= 0) ? offset : 0;

            if (safeLimit !== null) {
                dataQuery += ` LIMIT $${paramIndex}`;
                values.push(safeLimit);
                paramIndex++;
                dataQuery += ` OFFSET $${paramIndex}`;
                values.push(safeOffset);
            }
            dataQuery += ';';

            console.log('--- Anomaly.findAll SQL Diagnosis ---');
            console.log('Count Query:', countQuery);
            console.log('Data Query:', dataQuery);
            console.log('Query Parameters (values):', values);
            console.log('Effective Limit:', safeLimit);
            console.log('Effective Offset:', safeOffset);
            console.log('--------------------------------------');

            const dataResult = await client.query(dataQuery, values);
            const formattedRows = dataResult.rows.map(row => this._formatAnomalyData(row));
            return { rows: formattedRows, totalCount };
        } catch (error) {
            console.error(`Database Error during findAll anomalies: ${error.message}`, error.stack);
            throw new Error(`Error fetching anomalies: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async countAllAnomalies() {
        const client = await this.pool.connect();
        try {
            const query = `SELECT COUNT(*)::int AS count FROM ${this.tableName};`;
            const result = await client.query(query);
            return result.rows[0].count;
        } catch (error) {
            console.error(`Database Error counting all anomalies: ${error.message}`, error.stack);
            throw new Error(`Error counting anomalies: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async create(anomalyData) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO ${this.tableName} (
                    rule_name, description, severity, status, timestamp,
                    transaction_id, user_id, transaction_data, risk_score,
                    comments, resolved_at, resolved_by, triggered_by, resolution_notes,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11, $12, $13::jsonb, $14, NOW(), NOW())
                RETURNING *;
            `;
            const values = [
                anomalyData.rule_name || 'ML_Anomaly_Detection',
                anomalyData.description || 'Detected by ML model',
                anomalyData.severity || this._deriveSeverityFromRisk(anomalyData.risk_score),
                anomalyData.status || 'open',
                anomalyData.timestamp || new Date().toISOString(),
                anomalyData.transaction_id,
                anomalyData.user_id,
                anomalyData.transaction_data || {},
                anomalyData.risk_score || 0.0,
                anomalyData.comments || [],
                anomalyData.resolved_at,
                anomalyData.resolved_by,
                anomalyData.triggered_by || { type: 'ML Model', algorithm: 'IsolationForest', version: anomalyData.model_version || '1.0', description: 'Isolation Forest - Isolates anomalies by randomly selecting features and split values' },
                anomalyData.resolution_notes,
            ];

            const result = await client.query(query, values);
            return this._formatAnomalyData(result.rows[0]);
        } catch (error) {
            console.error(`Database Error during anomaly creation: ${error.message}`, error.stack);
            if (error.code === '23503') {
                throw new Error(`Foreign Key Violation: The transaction_id '${anomalyData.transaction_id}' does not exist in the transactions table.`);
            }
            throw new Error(`Error creating anomaly: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = $1;`;
            const result = await client.query(query, [id]);
            return this._formatAnomalyData(result.rows[0]);
        } catch (error) {
            console.error(`Database Error during findById anomaly: ${error.message}`, error.stack);
            throw new Error(`Error finding anomaly by ID: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findByTransactionId(transactionId) {
        const client = await this.pool.connect();
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE transaction_id = $1 ORDER BY timestamp DESC;`;
            const result = await client.query(query, [transactionId]);
            return result.rows.map(row => this._formatAnomalyData(row));
        } catch (error) {
            console.error(`Database Error during findByTransactionId anomaly: ${error.message}`, error.stack);
            throw new Error(`Error finding anomaly by transaction ID: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async update(id, updateData) {
        const client = await this.pool.connect();
        try {
            const fields = [];
            const values = [id];
            let paramIndex = 2;

            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {
                    if (['comments', 'transaction_data', 'triggered_by', 'resolver_info'].includes(key)) {
                        fields.push(`${key} = $${paramIndex}::jsonb`);
                    } else if (key === 'risk_score' && typeof updateData[key] === 'number') {
                        fields.push(`${key} = $${paramIndex}`);
                        if (!updateData.severity) {
                            fields.push(`severity = $${paramIndex + 1}`);
                            values.push(this._deriveSeverityFromRisk(updateData[key]));
                            paramIndex++;
                        }
                    } else {
                        fields.push(`${key} = $${paramIndex}`);
                    }
                    if (!(key === 'risk_score' && !updateData.severity)) {
                        values.push(updateData[key]);
                        paramIndex++;
                    }
                }
            }

            fields.push(`updated_at = NOW()`);

            if (fields.length === 1 && fields[0].includes('updated_at')) {
                const existingAnomaly = await this.findById(id);
                return existingAnomaly;
            }

            const query = `
                UPDATE ${this.tableName}
                SET ${fields.join(', ')}
                WHERE id = $1
                RETURNING *;
            `;

            const result = await client.query(query, values);
            return this._formatAnomalyData(result.rows[0]);
        } catch (error) {
            console.error(`Database Error during anomaly update (ID: ${id}): ${error.message}`, error.stack);
            if (error.code === '23503') {
                throw new Error(`Foreign Key Violation: The transaction_id in update data does not exist.`);
            }
            throw new Error(`Error updating anomaly: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async del(id) {
        const client = await this.pool.connect();
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id;`;
            const result = await client.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error(`Database Error during anomaly deletion (ID: ${id}): ${error.message}`, error.stack);
            throw new Error(`Error deleting anomaly: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async addComment(anomalyId, comment, userId, username) {
        const client = await this.pool.connect();
        try {
            const newComment = {
                id: require('crypto').randomUUID(),
                text: comment.text,
                timestamp: new Date().toISOString(),
                user_id: userId,
                username: username,
            };

            const query = `
                UPDATE ${this.tableName}
                SET comments = COALESCE(comments, '[]'::jsonb) || $1::jsonb,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `;
            const result = await client.query(query, [JSON.stringify(newComment), anomalyId]);
            return this._formatAnomalyData(result.rows[0]);
        } catch (error) {
            console.error(`Database Error adding comment to anomaly ${anomalyId}: ${error.message}`, error.stack);
            throw new Error(`Error adding comment to anomaly: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getAnomalySeverityDistribution(period = 30) {
        const client = await this.pool.connect();
        try {
            if (period <= 0) throw new Error('Period must be a positive number.');
            const query = `
                SELECT
                    severity,
                    COUNT(*)::int AS count
                FROM ${this.tableName}
                WHERE timestamp >= NOW() - INTERVAL '${period} day'
                GROUP BY severity
                ORDER BY count DESC;
            `;
            const result = await client.query(query);
            return result.rows;
        } catch (error) {
            console.error(`Database Error getting anomaly severity distribution: ${error.message}`, error.stack);
            throw new Error(`Error fetching anomaly severity distribution: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getOpenAnomaliesCount(minRiskScore = 0.5) {
        const client = await this.pool.connect();
        try {
            const query = `
                SELECT COUNT(*)::int AS count
                FROM ${this.tableName}
                WHERE status = 'open' AND risk_score >= $1;
            `;
            const result = await client.query(query, [minRiskScore]);
            return result.rows[0].count;
        } catch (error) {
            console.error(`Database Error getting open anomalies count: ${error.message}`, error.stack);
            throw new Error(`Error fetching open anomalies count: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getRecentAnomalies(limit = 5, period = 30) {
        const client = await this.pool.connect();
        try {
            if (period <= 0) throw new Error('Period must be a positive number.');
            const query = `
                SELECT *
                FROM ${this.tableName}
                WHERE timestamp >= NOW() - INTERVAL '${period} day'
                ORDER BY timestamp DESC
                LIMIT $1;
            `;
            const result = await client.query(query, [Math.max(1, limit)]);
            const formattedRows = result.rows.map(row => this._formatAnomalyData(row));
            return formattedRows;
        } catch (error) {
            console.error(`Database Error getting recent anomalies: ${error.message}`, error.stack);
            throw new Error(`Error fetching recent anomalies: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async query(sql, params) {
        const client = await this.pool.connect();
        try {

            const result = await client.query(sql, params);
            return result;
        } catch (error) {
            console.error(`Database Error during query execution: ${error.message}`, error.stack);
            throw new Error(`Error executing query: ${error.message}`);
        } finally {
            client.release();
        }
    }

    _deriveSeverityFromRisk(risk_score) {
        if (risk_score >= 0.8) return 'High';
        if (risk_score >= 0.5) return 'Medium';
        return 'Low';
    }

    async getAllAnomalies() {
        const client = await this.pool.connect();
        try {
            const query = `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC;`;
            const result = await client.query(query);
            return result.rows.map(row => this._formatAnomalyData(row));
        } catch (error) {
            console.error('Database Error during getAllAnomalies:', error.message, error.stack);
            throw new Error(`Error fetching all anomalies: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = Anomaly;