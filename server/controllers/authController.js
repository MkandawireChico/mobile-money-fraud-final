module.exports = (userModel, jwt, bcrypt, redisClient, auditLogModel) => {
    const logAudit = async (actionType, req, description, details = {}, entityType = null, entityId = null) => {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : 'System/Anonymous';
        const ipAddress = req.ip;

        try {
            await auditLogModel.create({
                user_id: userId,
                username: username,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                description: description,
                details: { ...details, ip_address: ipAddress },
                ip_address: ipAddress,
            });
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError.message);
        }
    };

    const generateToken = (user) => {
        return jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );
    };

        return {
            register: async (req, res) => {
                const { username, email, password, role } = req.body;

                if (!username || !email || !password) {
                    return res.status(400).json({ message: 'Please enter all required fields: username, email, password.' });
                }

                try {
                    const existingUser = await userModel.findByEmail(email);
                    if (existingUser) {
                        return res.status(409).json({ message: 'User with that email already exists.' });
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const newUser = await userModel.create({
                        username,
                        email,
                        password_hash: hashedPassword,
                        role: role || 'viewer',
                        status: 'active',
                    });

                    const { password_hash, ...userWithoutHash } = newUser;

                    await logAudit(
                        'USER_REGISTERED',
                        req,
                        `User registered: ${username} (${email})`,
                        { userId: newUser.id, email: newUser.email, role: newUser.role },
                        'User',
                        newUser.id
                    );

                    res.status(201).json({ message: 'User registered successfully. Please log in.', user: userWithoutHash });
                } catch (error) {
                    console.error('Registration error:', error.message);
                    res.status(500).json({ message: 'Server error during registration.', error: error.message });
                }
            },

            login: async (req, res) => {
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).json({ message: 'Please enter email and password.' });
                }

                try {
                    const user = await userModel.findByEmail(email);

                    if (!user) {
                        await logAudit(
                            'LOGIN_FAILED',
                            req,
                            `Failed login attempt for email: ${email} (User not found)`,
                            { email },
                            'User',
                            null
                        );
                        return res.status(401).json({ message: 'Invalid credentials.' });
                    }

                    if (user.status !== 'active') {
                        await logAudit(
                            'LOGIN_FAILED',
                            req,
                            `Failed login attempt for email: ${email} (User inactive/suspended)`,
                            { userId: user.id, email: user.email, status: user.status },
                            'User',
                            user.id
                        );
                        return res.status(403).json({ message: `Account is ${user.status}. Please contact support.` });
                    }

                    const isMatch = await bcrypt.compare(password, user.password_hash);

                    if (!isMatch) {
                        await logAudit(
                            'LOGIN_FAILED',
                            req,
                            `Failed login attempt for user: ${user.username} (Incorrect password)`,
                            { userId: user.id, email: user.email },
                            'User',
                            user.id
                        );
                        return res.status(401).json({ message: 'Invalid credentials.' });
                    }

                    // Generate JWT
                    const token = generateToken(user);

                    // Update last login timestamp
                    await userModel.updateLastLogin(user.id);

                    // Store token in Redis (optional, for blacklist or session management)
                    // Use redisClient.set directly as it's already promise-based
                    // await redisClient.set(`token:${user.id}`, token, { EX: 3600 }); // Store for 1 hour with expiry

                    // Remove password hash before sending response
                    const { password_hash, ...userWithoutHash } = user;

                    await logAudit(
                        'USER_LOGIN',
                        req,
                        `User logged in: ${user.username} (${user.email})`,
                        { userId: user.id, email: user.email },
                        'User',
                        user.id
                    );

                    res.status(200).json({
                        message: 'Logged in successfully.',
                        token,
                        user: userWithoutHash,
                    });
                } catch (error) {
                    console.error('[AuthController] Login error:', error.message, error.stack);
                    res.status(500).json({ message: 'Server error during login.', error: error.message });
                }
            },

            logout: async (req, res) => {
                try {
                    // Assuming token is sent in Authorization header and decoded by protect middleware
                    if (req.user && req.user.id) {
                        // Invalidate token in Redis if it was stored
                        // Use redisClient.del directly as it's already promise-based
                        // await redisClient.del(`token:${req.user.id}`);
                        await logAudit(
                            'USER_LOGOUT',
                            req,
                            `User logged out: ${req.user.username}`,
                            { userId: req.user.id },
                            'User',
                            req.user.id
                        );

                    }
                    res.status(200).json({ message: 'Logged out successfully.' });
                } catch (error) {
                    console.error('[AuthController] Logout error:', error.message, error.stack);
                    res.status(500).json({ message: 'Server error during logout.', error: error.message });
                }
            },

            refreshToken: async (req, res) => {
                // This endpoint would typically receive a refresh token, validate it,
                // and then issue a new access token. For simplicity, we're re-issuing
                // based on the current authenticated user (from protect middleware).
                // In a real-world app, you'd have a separate refresh token mechanism.
                if (!req.user) {
                    return res.status(401).json({ message: 'Authentication required for token refresh.' });
                }

                try {
                    const user = await userModel.findById(req.user.id);
                    if (!user || user.status !== 'active') {
                        return res.status(401).json({ message: 'User not found or inactive.' });
                    }

                    const newToken = generateToken(user);

                    await logAudit(
                        'TOKEN_REFRESHED',
                        req,
                        `Token refreshed for user: ${user.username}`,
                        { userId: user.id },
                        'User',
                        user.id
                    );

                    res.status(200).json({ token: newToken });
                } catch (error) {
                    console.error('[AuthController] Token refresh error:', error.message, error.stack);
                    res.status(500).json({ message: 'Failed to refresh token.', error: error.message });
                }
            },

            changePassword: async (req, res) => {
                const { oldPassword, newPassword } = req.body;
                const userId = req.user.id; // From authenticated user

                if (!oldPassword || !newPassword) {
                    return res.status(400).json({ message: 'Both old and new passwords are required.' });
                }

                try {
                    const user = await userModel.findById(userId);
                    if (!user) {
                        return res.status(404).json({ message: 'User not found.' });
                    }

                    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
                    if (!isMatch) {
                        return res.status(401).json({ message: 'Old password does not match.' });
                    }

                    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                    await userModel.update(userId, { password_hash: hashedNewPassword });

                    await logAudit(
                        'PASSWORD_CHANGED',
                        req,
                        `User changed password: ${user.username}`,
                        { userId: user.id },
                        'User',
                        user.id
                    );

                    res.status(200).json({ message: 'Password changed successfully.' });
                } catch (error) {
                    console.error('[AuthController] Change password error:', error.message, error.stack);
                    res.status(500).json({ message: 'Failed to change password.', error: error.message });
                }
            },
        };
    };
