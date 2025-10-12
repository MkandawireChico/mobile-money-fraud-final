
const crypto = require('crypto');
const nodemailer = require('nodemailer');

module.exports = (userModel, jwt, bcrypt, redisClient, auditLogModel) => {

    // Configure email transporter
    const createEmailTransporter = () => {
        // Check if email service is configured
        if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('[Email] Email service not configured. Using demo mode.');
            return null;
        }

        try {
            return nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } catch (error) {
            console.error('[Email] Failed to create email transporter:', error.message);
            return null;
        }
    };

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
            console.error(`[AuditLog Error] Failed to create audit log for ${actionType}:`, auditError.message);
        }
    };

    const generateSecureToken = () => {
        return crypto.randomBytes(32).toString('hex');
    };

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const sendEmail = async (to, subject, message) => {
        const transporter = createEmailTransporter();
        
        // If no transporter configured, use demo mode
        if (!transporter) {
            console.log('\n=== EMAIL DEMO MODE ===');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message:\n${message}`);
            console.log('========================\n');
            return { success: true, mode: 'demo' };
        }

        try {
            // Verify transporter connection
            await transporter.verify();
            
            const mailOptions = {
                from: {
                    name: 'Malawi Mobile Money Fraud Detection System',
                    address: process.env.EMAIL_USER
                },
                to: to,
                subject: subject,
                text: message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                        <div style="background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                            <h2 style="color: #1e40af; margin: 0 0 20px 0;">🛡️ Malawi Mobile Money</h2>
                            <h3 style="color: #374151; margin: 0 0 20px 0;">Fraud Detection System</h3>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <div style="font-family: monospace; font-size: 14px; line-height: 1.5; white-space: pre-line;">${message}</div>
                            </div>
                            <p style="color: #6b7280; font-size: 11px; margin: 15px 0 0 0;">
                                Automated message - Do not reply
                            </p>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[Email] Successfully sent to ${to}. Message ID: ${info.messageId}`);
            
            return { 
                success: true, 
                mode: 'production', 
                messageId: info.messageId,
                response: info.response 
            };

        } catch (error) {
            console.error(`[Email] Failed to send email to ${to}:`, error.message);
            
            // Fallback to demo mode if email fails
            console.log('\n=== EMAIL FALLBACK (Demo Mode) ===');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message:\n${message}`);
            console.log('==================================\n');
            
            return { 
                success: true, 
                mode: 'fallback', 
                error: error.message 
            };
        }
    };

    return {

        initiatePasswordReset: async (req, res) => {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email address is required.' });
            }

            try {
                const user = await userModel.findByEmail(email);

                if (!user) {
                    // Don't reveal if email exists for security
                    return res.status(200).json({
                        message: 'If an account with that email exists, a password reset link has been sent.'
                    });
                }

                // Check if user is registered in the system and verify role
                if (!user || (user.role !== 'admin' && user.role !== 'analyst' && user.role !== 'viewer')) {
                    return res.status(200).json({
                        message: 'If an account with that email exists, a password reset link has been sent.'
                    });
                }

                // Block analysts from password reset - they must contact admin
                if (user.role === 'analyst') {
                    await logAudit(
                        'PASSWORD_RESET_BLOCKED',
                        req,
                        `Password reset blocked for analyst: ${user.username} - must contact admin`,
                        { userId: user.id, email: user.email, role: user.role },
                        'User',
                        user.id
                    );
                    return res.status(403).json({
                        message: 'Password reset is not available for analyst accounts. Please contact your system administrator for assistance.',
                        contactAdmin: true
                    });
                }

                if (user.status !== 'active') {
                    await logAudit(
                        'PASSWORD_RESET_BLOCKED',
                        req,
                        `Password reset blocked for inactive user: ${user.username}`,
                        { userId: user.id, email: user.email, status: user.status },
                        'User',
                        user.id
                    );
                    return res.status(200).json({
                        message: 'If an account with that email exists, a password reset link has been sent.'
                    });
                }

                // Generate secure reset token
                const resetToken = generateSecureToken();
                const resetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

                // Store reset token in Redis with expiry
                await redisClient.setEx(`password_reset:${resetToken}`, 1800, JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    createdAt: new Date().toISOString()
                }));

                // Send clean reset email
                const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
                const emailMessage = `
Malawi Mobile Money Fraud Detection System

Password Reset Link:
${resetUrl}

Valid for 30 minutes only.

If you did not request this, ignore this email.
                `;

                await sendEmail(user.email, 'Password Reset Request - Fraud Detection System', emailMessage);

                await logAudit(
                    'PASSWORD_RESET_INITIATED',
                    req,
                    `Password reset initiated for user: ${user.username}`,
                    { userId: user.id, email: user.email },
                    'User',
                    user.id
                );

                res.status(200).json({
                    message: 'If an account with that email exists, a password reset link has been sent.'
                });

            } catch (error) {
                console.error('[PasswordRecovery] Initiate reset error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to process password reset request.' });
            }
        },

        resetPassword: async (req, res) => {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ message: 'Reset token and new password are required.' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
            }

            try {
                // Verify reset token
                const resetData = await redisClient.get(`password_reset:${token}`);

                if (!resetData) {
                    return res.status(400).json({ message: 'Invalid or expired reset token.' });
                }

                const { userId, email } = JSON.parse(resetData);
                const user = await userModel.findById(userId);

                if (!user || user.email !== email) {
                    return res.status(400).json({ message: 'Invalid reset token.' });
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 12);

                // Update password
                await userModel.update(userId, {
                    password_hash: hashedPassword,
                    updated_at: new Date()
                });

                // Delete reset token
                await redisClient.del(`password_reset:${token}`);

                // Invalidate all existing sessions for this user
                const keys = await redisClient.keys(`token:${userId}*`);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }

                await logAudit(
                    'PASSWORD_RESET_COMPLETED',
                    req,
                    `Password successfully reset for user: ${user.username}`,
                    { userId: user.id, email: user.email },
                    'User',
                    user.id
                );

                res.status(200).json({ message: 'Password has been successfully reset. Please log in with your new password.' });

            } catch (error) {
                console.error('[PasswordRecovery] Reset password error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to reset password.' });
            }
        },

        generateRecoveryOTP: async (req, res) => {
            const { email, employeeId } = req.body;

            if (!email || !employeeId) {
                return res.status(400).json({ message: 'Email and Employee ID are required.' });
            }

            try {
                const user = await userModel.findByEmail(email);

                if (!user) {
                    return res.status(404).json({ message: 'No account found with the provided credentials.' });
                }

                // OTP Recovery is restricted to Admin accounts only
                if (user.role !== 'admin') {
                    await logAudit(
                        'RECOVERY_OTP_DENIED',
                        req,
                        `OTP recovery denied for non-admin user: ${user.username} (${user.role})`,
                        { userId: user.id, email: user.email, role: user.role },
                        'User',
                        user.id
                    );
                    return res.status(403).json({ 
                        message: 'OTP recovery is restricted to administrators only. Please contact your system administrator for assistance.',
                        contactAdmin: true
                    });
                }

                // Additional verification for admin accounts
                if (user.role === 'admin') {
                    // In production, verify employeeId against HR system
                    // For now, we'll use a simple check
                    if (!employeeId.startsWith('EMP')) {
                        return res.status(400).json({ message: 'Invalid employee ID format.' });
                    }
                }

                // Generate OTP
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                // Store OTP in Redis
                await redisClient.setEx(`recovery_otp:${email}`, 600, JSON.stringify({
                    otp: otp,
                    userId: user.id,
                    employeeId: employeeId,
                    attempts: 0,
                    createdAt: new Date().toISOString()
                }));

                // Send clean OTP email
                const emailMessage = `
Malawi Mobile Money Fraud Detection System

Your OTP Code: ${otp}

Valid for 10 minutes only.

If you did not request this, contact your administrator immediately.
                `;

                await sendEmail(user.email, 'Account Recovery OTP', emailMessage);

                await logAudit(
                    'RECOVERY_OTP_GENERATED',
                    req,
                    `Recovery OTP generated for user: ${user.username}`,
                    { userId: user.id, email: user.email, employeeId: employeeId },
                    'User',
                    user.id
                );

                res.status(200).json({
                    message: 'Recovery OTP has been sent to your email address.',
                    expiresIn: '10 minutes'
                });

            } catch (error) {
                console.error('[PasswordRecovery] Generate OTP error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to generate recovery OTP.' });
            }
        },

        verifyRecoveryOTP: async (req, res) => {
            const { email, otp, employeeId } = req.body;

            if (!email || !otp || !employeeId) {
                return res.status(400).json({ message: 'Email, OTP, and Employee ID are required.' });
            }

            try {
                const otpData = await redisClient.get(`recovery_otp:${email}`);

                if (!otpData) {
                    return res.status(400).json({ message: 'Invalid or expired OTP.' });
                }

                const { otp: storedOtp, userId, employeeId: storedEmployeeId, attempts } = JSON.parse(otpData);

                // Check attempt limit
                if (attempts >= 3) {
                    await redisClient.del(`recovery_otp:${email}`);
                    await logAudit(
                        'RECOVERY_OTP_BLOCKED',
                        req,
                        `Recovery OTP blocked due to too many attempts for email: ${email}`,
                        { email: email, employeeId: employeeId, attempts: attempts },
                        'User',
                        userId
                    );
                    return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
                }

                // Verify OTP and employee ID
                if (otp !== storedOtp || employeeId !== storedEmployeeId) {
                    // Increment attempts
                    await redisClient.setEx(`recovery_otp:${email}`, 600, JSON.stringify({
                        otp: storedOtp,
                        userId: userId,
                        employeeId: storedEmployeeId,
                        attempts: attempts + 1,
                        createdAt: new Date().toISOString()
                    }));

                    return res.status(400).json({ message: 'Invalid OTP or Employee ID.' });
                }

                const user = await userModel.findById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found.' });
                }

                // Generate temporary recovery token (valid for 15 minutes)
                const recoveryToken = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        type: 'recovery',
                        employeeId: employeeId
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );

                // Delete OTP
                await redisClient.del(`recovery_otp:${email}`);

                await logAudit(
                    'RECOVERY_OTP_VERIFIED',
                    req,
                    `Recovery OTP verified for user: ${user.username}`,
                    { userId: user.id, email: user.email, employeeId: employeeId },
                    'User',
                    user.id
                );

                res.status(200).json({
                    message: 'OTP verified successfully. You now have temporary access.',
                    recoveryToken: recoveryToken,
                    expiresIn: '15 minutes',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                });

            } catch (error) {
                console.error('[PasswordRecovery] Verify OTP error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to verify OTP.' });
            }
        },

        emergencyAdminAccess: async (req, res) => {
            const { masterKey, justification } = req.body;

            if (!masterKey || !justification) {
                return res.status(400).json({ message: 'Master key and justification are required.' });
            }

            try {
                // Verify master key (in production, this should be a secure hash)
                const expectedMasterKey = process.env.EMERGENCY_MASTER_KEY;

                if (!expectedMasterKey || masterKey !== expectedMasterKey) {
                    await logAudit(
                        'EMERGENCY_ACCESS_DENIED',
                        req,
                        `Emergency admin access denied - Invalid master key`,
                        { justification: justification },
                        'System',
                        null
                    );
                    return res.status(403).json({ message: 'Invalid master key.' });
                }

                // Find or create emergency admin user
                let emergencyAdmin = await userModel.findByEmail('emergency@system.local');

                if (!emergencyAdmin) {
                    // Create emergency admin account
                    const tempPassword = generateSecureToken().substring(0, 16);
                    const hashedPassword = await bcrypt.hash(tempPassword, 12);

                    emergencyAdmin = await userModel.create({
                        username: 'EmergencyAdmin',
                        email: 'emergency@system.local',
                        password_hash: hashedPassword,
                        role: 'admin',
                        status: 'active'
                    });
                }

                // Generate emergency access token (valid for 30 minutes)
                const emergencyToken = jwt.sign(
                    {
                        id: emergencyAdmin.id,
                        username: emergencyAdmin.username,
                        role: emergencyAdmin.role,
                        type: 'emergency',
                        justification: justification
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '30m' }
                );

                await logAudit(
                    'EMERGENCY_ACCESS_GRANTED',
                    req,
                    `Emergency admin access granted`,
                    {
                        justification: justification,
                        emergencyUserId: emergencyAdmin.id,
                        accessDuration: '30 minutes'
                    },
                    'System',
                    emergencyAdmin.id
                );

                res.status(200).json({
                    message: 'Emergency admin access granted.',
                    emergencyToken: emergencyToken,
                    expiresIn: '30 minutes',
                    user: {
                        id: emergencyAdmin.id,
                        username: emergencyAdmin.username,
                        role: emergencyAdmin.role
                    },
                    warning: 'This is emergency access. All actions are logged and monitored.'
                });

            } catch (error) {
                console.error('[PasswordRecovery] Emergency access error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to process emergency access request.' });
            }
        },

        getRecoveryOptions: async (req, res) => {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ message: 'Email address is required.' });
            }

            try {
                const user = await userModel.findByEmail(email);

                const options = {
                    passwordReset: true,
                    otpRecovery: false,
                    emergencyAccess: false,
                    contactAdmin: true
                };

                if (user) {
                    // OTP Recovery is restricted to Admin accounts only
                    if (user.role === 'admin') {
                        options.otpRecovery = true;
                        options.emergencyAccess = true;
                    }

                    // Analysts should contact admin for recovery assistance
                    if (user.role === 'analyst') {
                        options.contactAdmin = true;
                        options.otpRecovery = false;
                    }
                }

                res.status(200).json({
                    recoveryOptions: options,
                    message: 'Available recovery options for your account.'
                });

            } catch (error) {
                console.error('[PasswordRecovery] Get recovery options error:', error.message, error.stack);
                res.status(500).json({ message: 'Failed to retrieve recovery options.' });
            }
        }
    };
};
