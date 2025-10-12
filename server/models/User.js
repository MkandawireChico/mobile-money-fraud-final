

class User {

    constructor(pool) {
        this.pool = pool;
    }

    async findAll(filters = {}, search = '', limit = null, offset = 0) {
        const client = await this.pool.connect();
        try {
            let baseConditions = '1=1';
            const values = [];
            let paramIndex = 1;

            if (filters.role) {
                baseConditions += ` AND role = $${paramIndex}`;
                values.push(filters.role);
                paramIndex++;
            }
            if (filters.status) {
                baseConditions += ` AND status = $${paramIndex}`;
                values.push(filters.status);
                paramIndex++;
            }
            if (filters.start_date) {
                baseConditions += ` AND created_at >= $${paramIndex}`;
                values.push(filters.start_date);
                paramIndex++;
            }
            if (filters.end_date) {
                baseConditions += ` AND created_at <= $${paramIndex}`;
                values.push(filters.end_date);
                paramIndex++;
            }

            if (search && typeof search === 'string' && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                // Add 'name' to the search criteria
                baseConditions += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
                values.push(searchTerm, searchTerm, searchTerm); // Push searchTerm three times for username, email, name
                paramIndex++;
            }

            const countQuery = `SELECT COUNT(*)::int AS count FROM users WHERE ${baseConditions};`;
            const countResult = await client.query(countQuery, values);
            const totalCount = parseInt(countResult.rows[0].count, 10);

            // Include 'name' in the SELECT clause
            let dataQuery = `SELECT id, username, email, name, role, status, created_at, updated_at, last_login FROM users WHERE ${baseConditions}`;
            dataQuery += ' ORDER BY created_at DESC'; // Default order

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

            console.log('--- UserModel.findAll SQL Diagnosis ---');
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
            console.error('Database Error during findAll users:', error.message, error.stack);
            throw new Error(`Error fetching users: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async create(userData) {
        const client = await this.pool.connect();
        try {
            const query = `
                INSERT INTO users (
                    username, email, password_hash, name, role, status, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING id, username, email, name, role, status, created_at, updated_at, last_login;
            `;
            const values = [
                userData.username,
                userData.email,
                userData.password_hash,
                userData.name || null, // Allow name to be null if not provided
                userData.role || 'viewer',
                userData.status || 'active',
            ];

            // Adjusted console log to show name and exclude password hash

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Database Error during user creation:', error.message, error.stack);
            throw new Error(`Error creating user: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findById(id) {
        const client = await this.pool.connect();
        try {
            // Include 'name' in the SELECT clause
            const query = 'SELECT id, username, email, name, role, status, created_at, updated_at, last_login FROM users WHERE id = $1;';
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {

            if (error.message && error.message.includes('timeout')) {
                console.error('[UserModel] Database timeout during findById:', error.message);
                throw new Error('Database operation timed out. Please try again.');
            }
            if (error.message && error.message.includes('Connection terminated')) {
                console.error('[UserModel] Database connection terminated during findById:', error.message);
                throw new Error('Database connection lost. Please try again.');
            }

            console.error('Database Error during findById user:', error.message, error.stack);
            throw new Error(`Error finding user by ID: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async findByEmail(email) {
        const client = await this.pool.connect();
        try {
            // Select password_hash and 'name' here because this method is used for authentication
            const query = 'SELECT id, username, email, password_hash, name, role, status, created_at, updated_at, last_login FROM users WHERE email = $1;';
            const result = await client.query(query, [email]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Database Error during findByEmail user:', error.message, error.stack);
            throw new Error(`Error finding user by email: ${error.message}`);
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

            // Dynamically build SET clause for update
            if (updateData.username !== undefined) {
                fields.push(`username = $${paramIndex}`);
                values.push(updateData.username);
                paramIndex++;
            }
            if (updateData.email !== undefined) {
                fields.push(`email = $${paramIndex}`);
                values.push(updateData.email);
                paramIndex++;
            }
            if (updateData.password_hash !== undefined) {
                fields.push(`password_hash = $${paramIndex}`);
                values.push(updateData.password_hash);
                paramIndex++;
            }
            if (updateData.name !== undefined) {
                fields.push(`name = $${paramIndex}`);
                values.push(updateData.name);
                paramIndex++;
            }
            if (updateData.role !== undefined) {
                fields.push(`role = $${paramIndex}`);
                values.push(updateData.role);
                paramIndex++;
            }
            if (updateData.status !== undefined) {
                fields.push(`status = $${paramIndex}`);
                values.push(updateData.status);
                paramIndex++;
            }

            fields.push(`updated_at = NOW()`);

            if (fields.length === 1 && fields[0].includes('updated_at')) {
                // If only updated_at is being set, return existing user without a DB update
                const existingUser = await this.findById(id);
                return existingUser;
            }

            const query = `
                UPDATE users
                SET ${fields.join(', ')}
                WHERE id = $1
                RETURNING id, username, email, name, role, status, created_at, updated_at, last_login;
            `;

            // Adjusted console log for update values (excluding password hash if present)
            const logValues = [...values];
            const passwordHashIndex = fields.findIndex(field => field.includes('password_hash'));
            if (passwordHashIndex !== -1) {
                logValues[passwordHashIndex + 1] = '[HASHED_PASSWORD]'; // Replace actual hash with placeholder
            }

            const result = await client.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Database Error during user update (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error updating user: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async del(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM users WHERE id = $1 RETURNING id;';
            const result = await client.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            console.error(`Database Error during user deletion (ID: ${id}):`, error.message, error.stack);
            throw new Error(`Error deleting user: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async updateLastLogin(id) {
        const client = await this.pool.connect();
        try {
            const query = `
                UPDATE users
                SET last_login = NOW(), updated_at = NOW()
                WHERE id = $1
                RETURNING id, username, email, name, role, status, created_at, updated_at, last_login;
            `;
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Database Error updating last login for user ${id}:`, error.message, error.stack);
            throw new Error(`Error updating last login: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async countAll() { // Renamed from countAllUsers
        const client = await this.pool.connect();
        try {
            const query = 'SELECT COUNT(*)::int AS count FROM users;';
            const result = await client.query(query);
            return result.rows[0].count;
        } catch (error) {
            console.error('Database Error during countAll users:', error.message, error.stack);
            throw new Error(`Error counting all users: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = User;
