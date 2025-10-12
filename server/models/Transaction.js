

const format = require('pg-format');
const queryCache = require('../utils/queryCache');

class Transaction {

    constructor(pool) {
        this.pool = pool;
    }

    _validatePeriod(period, defaultPeriod = 30) {
        const validatedPeriod = parseInt(period, 10);
        if (isNaN(validatedPeriod) || validatedPeriod <= 0) {
            console.warn(`[Transaction] Invalid period received: ${period}. Using default: ${defaultPeriod}`);
            return defaultPeriod;
        }
        return validatedPeriod;
    }

    async findAll(filters = {}, search = '', limit = null, offset = 0) {
        const client = await this.pool.connect();
        const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
        try {
            console.time(`Transaction.findAll_total_${requestId}`);

            let conditions = [];
            const values = [];

            const addCondition = (clause, value) => {
                conditions.push(clause);
                values.push(value);
            };

            if (filters.status) addCondition(`status = $${values.length + 1}`, filters.status);
            if (filters.transaction_type) addCondition(`transaction_type = $${values.length + 1}`, filters.transaction_type);
            if (filters.merchant_id && !search) addCondition(`merchant_id = $${values.length + 1}`, filters.merchant_id);
            if (search && typeof search === 'string' && search.trim()) {
                const searchTerm = search.trim();
                // Prioritize exact matches for IDs, then pattern matches for other fields
                const searchConditions = `(
                    transaction_id = $${values.length + 1} OR
                    user_id = $${values.length + 1} OR
                    sender_msisdn = $${values.length + 1} OR
                    transaction_id::text ILIKE $${values.length + 2} OR
                    transaction_type ILIKE $${values.length + 2} OR
                    location_city ILIKE $${values.length + 2} OR
                    description ILIKE $${values.length + 2} OR
                    merchant_category ILIKE $${values.length + 2}
                )`;
                conditions.push(searchConditions);
                values.push(searchTerm, `%${searchTerm}%`);
            }
            if (filters.min_amount) addCondition(`amount >= $${values.length + 1}`, parseFloat(filters.min_amount));
            if (filters.max_amount) addCondition(`amount <= $${values.length + 1}`, parseFloat(filters.max_amount));
            if (filters.start_date) addCondition(`timestamp >= $${values.length + 1}`, filters.start_date);
            if (filters.end_date) addCondition(`timestamp <= $${values.length + 1}`, filters.end_date);
            if (filters.is_fraud !== undefined && filters.is_fraud !== null) {
                const isFraudBoolean = String(filters.is_fraud).toLowerCase() === 'true';
                addCondition(`is_fraud = $${values.length + 1}`, isFraudBoolean);
            }
            if (filters.merchant_category) addCondition(`merchant_category ILIKE $${values.length + 1}`, `%${filters.merchant_category}%`);

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const countQuery = `SELECT COUNT(*) FROM transactions ${whereClause};`;
            
            // Create cache key for count query
            const cacheKey = `count_${JSON.stringify(filters)}_${search || 'no_search'}`;
            let totalCount = queryCache.get(cacheKey);
            
            if (totalCount === null) {
                console.time(`Transaction.findAll_countQuery_${requestId}`);
                const countResult = await client.query(countQuery, values);
                console.timeEnd(`Transaction.findAll_countQuery_${requestId}`);
                totalCount = parseInt(countResult.rows[0].count, 10);
                
                // Cache for 30 seconds (counts change frequently)
                queryCache.set(cacheKey, totalCount, 30000);
            } else {
                console.log(`[Transaction] Using cached count: ${totalCount}`);
            }

            let dataQuery = `SELECT * FROM transactions ${whereClause} ORDER BY timestamp DESC`;
            const dataValues = [...values];
            let currentParamIndex = dataValues.length + 1;

            const safeLimit = (typeof limit === 'number' && limit > 0) ? limit : null;
            const safeOffset = (typeof offset === 'number' && offset >= 0) ? offset : 0;

            if (safeLimit !== null) {
                dataQuery += ` LIMIT $${currentParamIndex}`;
                dataValues.push(safeLimit);
                currentParamIndex++;
                dataQuery += ` OFFSET $${currentParamIndex}`;
                dataValues.push(safeOffset);
            }
            dataQuery += ';';

            console.log('--- TransactionModel.findAll SQL Diagnosis ---');
            console.log('Count Query:', countQuery);
            console.log('Data Query:', dataQuery);
            console.log('Count Query Parameters (values):', values);
            console.log('Data Query Parameters (dataValues):', dataValues);
            console.log('Effective Limit:', safeLimit);
            console.log('Effective Offset:', safeOffset);
            console.log('--------------------------------------');

            console.time(`Transaction.findAll_dataQuery_${requestId}`);
            const dataResult = await client.query(dataQuery, dataValues);
            console.timeEnd(`Transaction.findAll_dataQuery_${requestId}`);

            console.timeEnd(`Transaction.findAll_total_${requestId}`);
            return { rows: dataResult.rows, totalCount };
        } catch (error) {
            // Clean up any pending console timers to avoid warnings
            try {
                console.timeEnd(`Transaction.findAll_dataQuery_${requestId}`);
            } catch (e) {
                // Ignore if timer doesn't exist
            }
            try {
                console.timeEnd(`Transaction.findAll_countQuery_${requestId}`);
            } catch (e) {
                // Ignore if timer doesn't exist
            }
            try {
                console.timeEnd(`Transaction.findAll_total_${requestId}`);
            } catch (e) {
                // Ignore if timer doesn't exist
            }

            console.error('Database Error during findAll transactions:', error.message, error.stack);
            throw new Error(`Error fetching transactions: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async createMany(transactionsData) {
        if (!transactionsData || transactionsData.length === 0) {

            return [];
        }

        const columns = [
            'transaction_id', 'user_id', 'amount', 'currency', 'timestamp', 'status',
            'merchant_id', 'transaction_type',
            'ip_address', 'is_fraud',
            'sender_account', 'receiver_account', 'description', 'location_city',
            'location_country', 'device_type', 'os_type', 'merchant_category',
            'created_at', 'updated_at',
            'time_since_last_txn_sec', 'is_new_location', 'is_new_device',
            'transaction_hour_of_day', 'transaction_day_of_week',
            'user_total_transactions', 'user_total_amount_spent',
            'risk_score',
            'sender_msisdn', 'receiver_msisdn', 'telco_provider'
        ];

        const rows = transactionsData.map(t => [
            t.transaction_id,
            t.user_id,
            t.amount,
            t.currency,
            t.timestamp,
            t.status,
            t.merchant_id,
            t.transaction_type,
            t.ip_address,
            typeof t.is_fraud === 'string' ? t.is_fraud.toLowerCase() === 'true' : !!t.is_fraud,
            t.sender_account || null,
            t.receiver_account || null,
            t.description || null,
            t.location_city || null,
            t.location_country || null,
            t.device_type || null,
            t.os_type || null,
            t.merchant_category || null,
            'NOW()',
            'NOW()',
            t.time_since_last_txn_sec || null,
            t.is_new_location || false,
            t.is_new_device || false,
            t.transaction_hour_of_day || null,
            t.transaction_day_of_week || null,
            t.user_total_transactions || null,
            t.user_total_amount_spent || null,
            t.risk_score || 0.0,
            t.sender_msisdn || null,
            t.receiver_msisdn || null,
            t.telco_provider || null
        ]);

        const query = format(
            `INSERT INTO transactions (%I) VALUES %L ON CONFLICT (transaction_id) DO NOTHING RETURNING *;`,
            columns,
            rows
        );

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(query);
            await client.query('COMMIT');

            // Invalidate count caches when new transactions are created
            queryCache.invalidate('count_');
            
            return result.rows;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database Error during batch transaction creation:', error.message, error.stack);
            throw new Error(`Error creating transactions in batch: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM transactions WHERE transaction_id = $1;';
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Database Error during findById transaction:', error.message, error.stack);
            throw new Error(`Error finding transaction by ID: ${error.message}`);
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
                    if (key === 'amount' || key === 'time_since_last_txn_sec' || key === 'user_total_amount_spent' || key === 'risk_score') {
                        fields.push(`${key} = $${paramIndex}`);
                        values.push(parseFloat(updateData[key]));
                    } else if (key === 'is_fraud' || key === 'is_new_location' || key === 'is_new_device') {
                        fields.push(`${key} = $${paramIndex}`);
                        values.push(typeof updateData[key] === 'string' ? updateData[key].toLowerCase() === 'true' : !!updateData[key]);
                    } else if (key === 'transaction_hour_of_day' || key === 'transaction_day_of_week' || key === 'user_total_transactions') {
                        fields.push(`${key} = $${paramIndex}`);
                        values.push(parseInt(updateData[key], 10));
                    } else {
                        fields.push(`${key} = $${paramIndex}`);
                        values.push(updateData[key]);
                    }
                    paramIndex++;
                }
            }

            fields.push(`updated_at = NOW()`);

            if (fields.length === 1 && fields[0].includes('updated_at')) {
                const existingTransaction = await this.findById(id);
                return existingTransaction;
            }

            const query = `
                UPDATE transactions
                SET ${fields.join(', ')}
                WHERE transaction_id = $1
                RETURNING *;
            `;

            const result = await client.query(query, values);
            
            // Invalidate count caches when transactions are updated
            if (result.rows[0]) {
                queryCache.invalidate('count_');
            }
            
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Database Error during update transaction (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error updating transaction: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async del(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM transactions WHERE transaction_id = $1 RETURNING transaction_id;';
            const result = await client.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error(`Database Error during transaction deletion (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error deleting transaction: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async countAll() {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT COUNT(*)::int AS count FROM transactions;';
            const result = await client.query(query);
            return result.rows[0].count;
        } catch (error) {
            console.error('Database Error during countAll transactions:', error.message, error.stack);
            throw new Error(`Error counting all transactions: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getRecentTransactions(limit = 5) {
        const client = await this.pool.connect();
        try {
            console.time('Transaction.getRecentTransactions');
            const query = `
                SELECT
                    t.transaction_id,
                    t.user_id,
                    t.amount,
                    t.currency,
                    t.transaction_type,
                    t.status,
                    t.timestamp,
                    COALESCE(a.risk_score, 0.0)::numeric(5,2) AS anomaly_risk_score,
                    CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_anomaly
                FROM transactions t
                LEFT JOIN anomalies a ON t.transaction_id = a.transaction_id
                ORDER BY t.timestamp DESC
                LIMIT $1;
            `;
            const result = await client.query(query, [Math.max(1, limit)]);
            console.timeEnd('Transaction.getRecentTransactions');

            return result.rows;
        } catch (error) {
            console.error('Database Error during getRecentTransactions:', error.message, error.stack);
            throw new Error(`Error fetching recent transactions: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getTransactionsTrend(interval = 'day', period = 30) {
        const client = await this.pool.connect();
        try {
            console.time('Transaction.getTransactionsTrend');

            // Validate period parameter
            period = this._validatePeriod(period, 30);
            if (period <= 0) throw new Error('Period must be a positive number.');

            let dateTruncFormat;
            let intervalUnit;
            switch (interval) {
                case 'day':
                    dateTruncFormat = 'day';
                    intervalUnit = 'day';
                    break;
                case 'week':
                    dateTruncFormat = 'week';
                    intervalUnit = 'week';
                    break;
                case 'month':
                    dateTruncFormat = 'month';
                    intervalUnit = 'month';
                    break;
                default:
                    throw new Error('Invalid interval. Must be "day", "week", or "month".');
            }

            const dynamicStartDateQuery = `SELECT date_trunc('${dateTruncFormat}', NOW() - INTERVAL '${period} ${intervalUnit}')::timestamp AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                WITH DateSeries AS (
                    SELECT date_series::timestamp AS series_date
                    FROM GENERATE_SERIES(
                        date_trunc('${dateTruncFormat}', $1::timestamp),
                        date_trunc('${dateTruncFormat}', NOW()),
                        INTERVAL '1 ${intervalUnit}'
                    ) AS date_series
                ),
                AggregatedTransactions AS (
                    SELECT
                        DATE_TRUNC('${dateTruncFormat}', t.timestamp) AS bucket_date,
                        COUNT(DISTINCT t.transaction_id) AS total_transactions_count
                    FROM transactions t
                    WHERE t.timestamp >= date_trunc('${dateTruncFormat}', $1::timestamp) AND t.timestamp <= NOW()
                    GROUP BY 1
                )
                SELECT
                    TO_CHAR(ds.series_date, 'YYYY-MM-DD') AS date,
                    COALESCE(at.total_transactions_count, 0)::int AS count
                FROM DateSeries ds
                LEFT JOIN AggregatedTransactions at ON ds.series_date = at.bucket_date
                ORDER BY ds.series_date ASC;
            `;

            const result = await client.query(query, [dynamicStartDate]);
            console.timeEnd('Transaction.getTransactionsTrend');

            return result.rows;
        } catch (error) {
            console.error('Database Error during getTransactionsTrend:', error.message, error.stack);
            throw new Error(`Error fetching transactions trend: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getAnomalyRateTrend(interval = 'day', period = 30) {
        console.warn('[Transaction.getAnomalyRateTrend] This method is deprecated. Use anomalyService.getTransactionTrends instead.');
        const client = await this.pool.connect();
        try {
            console.time('Transaction.getAnomalyRateTrend');

            // Validate period parameter
            period = this._validatePeriod(period, 30);

            let dateTruncFormat;
            let intervalUnit;
            let dateFormat;

            switch (interval) {
                case 'hour':
                    dateTruncFormat = 'hour';
                    intervalUnit = 'hour';
                    dateFormat = 'YYYY-MM-DD HH24:00';
                    break;
                case 'day':
                    dateTruncFormat = 'day';
                    intervalUnit = 'day';
                    dateFormat = 'YYYY-MM-DD';
                    break;
                case 'week':
                    dateTruncFormat = 'week';
                    intervalUnit = 'week';
                    dateFormat = 'YYYY-MM-DD';
                    break;
                case 'month':
                    dateTruncFormat = 'month';
                    intervalUnit = 'month';
                    dateFormat = 'YYYY-MM';
                    break;
                default:
                    throw new Error('Invalid interval. Must be "hour", "day", "week", or "month".');
            }

            const dynamicStartDateQuery = `SELECT date_trunc('${dateTruncFormat}', NOW() - INTERVAL '${period} ${intervalUnit}')::timestamp AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                WITH DateSeries AS (
                    SELECT date_series::timestamp AS series_date
                    FROM GENERATE_SERIES(
                        date_trunc('${dateTruncFormat}', $1::timestamp),
                        date_trunc('${dateTruncFormat}', NOW()),
                        INTERVAL '1 ${intervalUnit}'
                    ) AS date_series
                ),
                AggregatedTransactions AS (
                    SELECT
                        DATE_TRUNC('${dateTruncFormat}', t.timestamp) AS bucket_date,
                        COUNT(DISTINCT t.transaction_id) AS total_transactions_count
                    FROM transactions t
                    WHERE t.timestamp >= date_trunc('${dateTruncFormat}', $1::timestamp) AND t.timestamp <= NOW()
                    GROUP BY 1
                ),
                AggregatedAnomalies AS (
                    SELECT
                        DATE_TRUNC('${dateTruncFormat}', a.timestamp) AS bucket_date,
                        COUNT(DISTINCT a.id) AS anomaly_transactions_count
                    FROM anomalies a
                    WHERE a.timestamp >= date_trunc('${dateTruncFormat}', $1::timestamp) AND a.timestamp <= NOW()
                    GROUP BY 1
                )
                SELECT
                    TO_CHAR(ds.series_date, '${dateFormat}') AS date,
                    COALESCE(at.total_transactions_count, 0)::int AS total_transactions,
                    COALESCE(aa.anomaly_transactions_count, 0)::int AS anomaly_transactions,
                    COALESCE(
                        (aa.anomaly_transactions_count::numeric / NULLIF(at.total_transactions_count, 0)) * 100,
                        0
                    )::numeric(5,2) AS anomaly_rate
                FROM DateSeries ds
                LEFT JOIN AggregatedTransactions at ON ds.series_date = at.bucket_date
                LEFT JOIN AggregatedAnomalies aa ON ds.series_date = aa.bucket_date
                ORDER BY ds.series_date ASC;
            `;

            const result = await client.query(query, [dynamicStartDate]);
            console.timeEnd('Transaction.getAnomalyRateTrend');

            return result.rows;
        } catch (error) {
            console.error('Database Error during getAnomalyRateTrend:', error.message, error.stack);
            throw new Error(`Error fetching anomaly rate trend: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getTransactionsAndAnomalyCountTrend(interval = 'day', period = 30) {
        console.warn('[Transaction.getTransactionsAndAnomalyCountTrend] This method is deprecated. Use anomalyService.getTransactionTrends instead.');
        const client = await this.pool.connect();
        try {
            console.time('Transaction.getTransactionsAndAnomalyCountTrend');

            // Validate period parameter
            period = this._validatePeriod(period, 30);

            let dateTruncFormat;
            let intervalUnit;
            let dateFormat;

            switch (interval) {
                case 'day':
                    dateTruncFormat = 'day';
                    intervalUnit = 'day';
                    dateFormat = 'YYYY-MM-DD';
                    break;
                case 'week':
                    dateTruncFormat = 'week';
                    intervalUnit = 'week';
                    dateFormat = 'YYYY-MM-DD';
                    break;
                case 'month':
                    dateTruncFormat = 'month';
                    intervalUnit = 'month';
                    dateFormat = 'YYYY-MM';
                    break;
                case 'hour':
                    dateTruncFormat = 'hour';
                    intervalUnit = 'hour';
                    dateFormat = 'YYYY-MM-DD HH24';
                    break;
                default:
                    throw new Error('Invalid interval. Must be "day", "week", "month", or "hour".');
            }

            const dynamicStartDateQuery = `SELECT date_trunc('${dateTruncFormat}', NOW() - INTERVAL '${period} ${intervalUnit}')::timestamp AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                WITH DateSeries AS (
                    SELECT date_series::timestamp AS series_date
                    FROM GENERATE_SERIES(
                        date_trunc('${dateTruncFormat}', $1::timestamp),
                        date_trunc('${dateTruncFormat}', NOW()),
                        INTERVAL '1 ${intervalUnit}'
                    ) AS date_series
                ),
                AggregatedTransactions AS (
                    SELECT
                        DATE_TRUNC('${dateTruncFormat}', t.timestamp) AS bucket_date,
                        COUNT(DISTINCT t.transaction_id) AS total_transactions_count
                    FROM transactions t
                    WHERE t.timestamp >= date_trunc('${dateTruncFormat}', $1::timestamp) AND t.timestamp <= NOW()
                    GROUP BY 1
                ),
                AggregatedAnomalies AS (
                    SELECT
                        DATE_TRUNC('${dateTruncFormat}', a.timestamp) AS bucket_date,
                        COUNT(DISTINCT a.id) AS anomaly_count
                    FROM anomalies a
                    WHERE a.timestamp >= date_trunc('${dateTruncFormat}', $1::timestamp) AND a.timestamp <= NOW()
                    GROUP BY 1
                )
                SELECT
                    TO_CHAR(ds.series_date, '${dateFormat}') AS date,
                    COALESCE(at.total_transactions_count, 0)::int AS total_transactions,
                    COALESCE(aa.anomaly_count, 0)::int AS anomaly_count
                FROM DateSeries ds
                LEFT JOIN AggregatedTransactions at ON ds.series_date = at.bucket_date
                LEFT JOIN AggregatedAnomalies aa ON ds.series_date = aa.bucket_date
                ORDER BY ds.series_date ASC;
            `;

            const result = await client.query(query, [dynamicStartDate]);
            console.timeEnd('Transaction.getTransactionsAndAnomalyCountTrend');

            return result.rows;
        } catch (error) {
            console.error('Database Error during getTransactionsAndAnomalyCountTrend:', error.message, error.stack);
            throw new Error(`Error fetching transaction and anomaly count trend: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getTopLocations(type, orderBy, limit = 10, period = 30) {
        const client = await this.pool.connect();
        try {
            console.time(`Transaction.getTopLocations_${type}_${orderBy}_${period}d`);

            // Validate period parameter
            period = this._validatePeriod(period, 30);
            if (period <= 0) throw new Error('Period must be a positive number.');

            let locationColumn;
            switch (type) {
                case 'city':
                    locationColumn = 'location_city';
                    break;
                case 'country':
                    locationColumn = 'location_country';
                    break;
                default:
                    throw new Error('Invalid type for getTopLocations. Must be "city" or "country".');
            }

            const effectiveOrderBy = typeof orderBy === 'string' ? orderBy.trim() : 'count';
            let orderByClause;
            switch (effectiveOrderBy) {
                case 'count':
                    orderByClause = 'COUNT(transaction_id) DESC';
                    break;
                case 'amount':
                    orderByClause = 'SUM(amount) DESC';
                    break;
                default:
                    console.warn(`[TransactionModel] Unexpected orderBy value received after sanitization: '${effectiveOrderBy}'. Defaulting to 'count'.`);
                    orderByClause = 'COUNT(transaction_id) DESC';
            }

            const dynamicStartDateQuery = `SELECT NOW() - INTERVAL '${period} day' AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                SELECT
                    ${locationColumn} AS location,
                    COUNT(transaction_id)::int AS transaction_count,
                    SUM(amount)::numeric(15,2) AS total_amount
                FROM transactions
                WHERE ${locationColumn} IS NOT NULL
                    AND ${locationColumn} != ''
                    AND timestamp >= $1
                GROUP BY ${locationColumn}
                ORDER BY ${orderByClause}
                LIMIT $2;
            `;

            const result = await client.query(query, [dynamicStartDate, Math.max(1, limit)]);
            console.timeEnd(`Transaction.getTopLocations_${type}_${orderBy}_${period}d`);
            console.log(`[TransactionModel] getTopLocations_${type}_${orderBy}_${period}d result:`, result.rows);
            return result.rows;
        } catch (error) {
            console.error(`Database Error during getTopLocations (${type}, ${orderBy}):`, error.message, error.stack);
            throw new Error(`Error fetching top locations: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getTransactionTypeDistribution(period = 30) {
        const client = await this.pool.connect();
        try {
            console.time(`Transaction.getTransactionTypeDistribution_${period}d`);

            // Validate period parameter
            period = this._validatePeriod(period, 30);
            if (period <= 0) throw new Error('Period must be a positive number.');

            const dynamicStartDateQuery = `SELECT NOW() - INTERVAL '${period} day' AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                SELECT
                    transaction_type,
                    COUNT(*)::int AS count
                FROM transactions
                WHERE transaction_type IS NOT NULL
                    AND transaction_type != ''
                    AND timestamp >= $1
                GROUP BY transaction_type
                ORDER BY count DESC;
            `;

            const result = await client.query(query, [dynamicStartDate]);
            console.timeEnd(`Transaction.getTransactionTypeDistribution_${period}d`);
            console.log(`[TransactionModel] getTransactionTypeDistribution_${period}d result:`, result.rows);
            return result.rows;
        } catch (error) {
            console.error('Database Error getting transaction type distribution:', error.message, error.stack);
            throw new Error(`Error fetching transaction type distribution: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async getAnomalySeverityDistribution(period = 30) {
        const client = await this.pool.connect();
        try {
            console.time(`Transaction.getAnomalySeverityDistribution_${period}d`);

            // Validate period parameter
            period = this._validatePeriod(period, 30);

            const dynamicStartDateQuery = `SELECT NOW() - INTERVAL '${period} day' AS start_date;`;
            const dynamicStartDateResult = await client.query(dynamicStartDateQuery);
            const dynamicStartDate = dynamicStartDateResult.rows[0].start_date;

            const query = `
                SELECT
                    severity,
                    COUNT(*)::int AS count
                FROM anomalies
                WHERE severity IS NOT NULL
                    AND severity != ''
                    AND timestamp >= $1
                GROUP BY severity
                ORDER BY count DESC;
            `;

            const result = await client.query(query, [dynamicStartDate]);
            console.timeEnd(`Transaction.getAnomalySeverityDistribution_${period}d`);
            console.log(`[TransactionModel] getAnomalySeverityDistribution_${period}d result:`, result.rows);
            return result.rows;
        } catch (error) {
            console.error('Database Error getting anomaly severity distribution:', error.message, error.stack);
            throw new Error(`Error fetching anomaly severity distribution: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = Transaction;