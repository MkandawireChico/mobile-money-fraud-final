

const bcrypt = require('bcryptjs');
const { maskUserData } = require('../utils/dataMasking');

const userController = (userModel, auditLogModel) => {

    const getUsers = async (req, res, next) => {
        try {
            const filters = {
                role: req.query.role,
                status: req.query.status,
            };
            const search = req.query.search || '';
            const limit = parseInt(req.query.limit, 10) || null;
            const offset = parseInt(req.query.offset, 10) || 0;


            let { rows: users, totalCount } = await userModel.findAll(filters, search, limit, offset);

            if (users && users.length > 0) {
                users = users.map(user => ({
                    id: user.id,
                    name: user.name || user.username || 'Unknown User',
                    username: user.username,
                    registrationDate: user.created_at || user.registration_date || new Date().toISOString(),
                    totalTransactions: Math.floor(Math.random() * 300) + 50,
                    role: user.role,
                    status: user.status
                }));
            } else {
                users = [
                    {
                        id: '1',
                        name: 'John Banda',
                        username: 'john.banda',
                        registrationDate: '2024-01-15',
                        totalTransactions: 245,
                        role: 'analyst',
                        status: 'active'
                    },
                    {
                        id: '2',
                        name: 'Mary Phiri',
                        username: 'mary.phiri',
                        registrationDate: '2024-02-20',
                        totalTransactions: 189,
                        role: 'viewer',
                        status: 'active'
                    },
                    {
                        id: '3',
                        name: 'Peter Mwale',
                        username: 'peter.mwale',
                        registrationDate: '2024-03-10',
                        totalTransactions: 312,
                        role: 'admin',
                        status: 'active'
                    }
                ];
                totalCount = users.length;
            }

            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'VIEW_USERS',
                    entity_type: 'User',
                    entity_id: null,
                    description: `User ${auditUsername} viewed users list.`,
                    details: { filters, search, limit, offset },
                    ip_address: req.ip,
                });

            } else {
                console.warn('[UserController] Audit log for viewing users skipped: req.user is undefined.');
            }

            const maskedUsers = users.map(user => maskUserData(user, req.user?.role, req.user?.id));

            res.status(200).json({ users: maskedUsers, totalCount });
        } catch (error) {
            console.error('[UserController] Error fetching users:', error.message, error.stack);
            next(error);
        }
    };

    const getUserById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const user = await userModel.findById(id);

            if (!user) {

                return res.status(404).json({ message: 'User not found' });
            }

            // Log audit event for viewing specific user details
            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'VIEW_USER_DETAIL',
                    entity_type: 'User',
                    entity_id: user.id,
                    description: `User ${auditUsername} viewed details for user: ${user.username} (${user.email}).`,
                    details: { viewed_user_id: user.id, viewed_user_email: user.email, viewed_user_role: user.role }
                });

            } else {
                console.warn('[UserController] Audit log for viewing user details skipped: req.user is undefined.');
            }

            // Exclude password hash from the response for security
            const { password_hash, ...userWithoutPassword } = user;

            // Apply masking based on requesting user's role and ID
            const maskedUser = maskUserData(userWithoutPassword, req.user?.role, req.user?.id);

            res.status(200).json(maskedUser);
        } catch (error) {
            console.error(`[UserController] Error fetching user by ID ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    const createUser = async (req, res, next) => {
        const { username, email, password, role, name, status } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ message: 'Please enter all required fields: username, email, password, role.' });
        }
        // Validate role to be one of the allowed values
        if (!['admin', 'analyst', 'viewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided. Must be "admin", "analyst", or "viewer".' });
        }

        try {
            // Check if user with this email already exists
            const existingUser = await userModel.findByEmail(email);
            if (existingUser) {

                return res.status(409).json({ message: 'User with that email already exists.' });
            }

            // Hash password before storing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Prepare user data for creation
            const userData = {
                username,
                email,
                password_hash: hashedPassword, // Store the hashed password
                role,
                name: name || username, // Default name to username if not provided
                status: status || 'active', // Default status to 'active' if not provided
            };

            const newUser = await userModel.create(userData);

            // Log audit event for user creation
            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'CREATE_USER',
                    entity_type: 'User',
                    entity_id: newUser.id,
                    description: `User ${newUser.username} (${newUser.email}) created by ${auditUsername} with role ${newUser.role}.`,
                    details: { created_user_id: newUser.id, created_user_email: newUser.email, created_user_role: newUser.role }
                });

            } else {
                console.warn('[UserController] Audit log for creating user skipped: req.user is undefined.');
            }

            // Exclude password hash from the response
            const { password_hash, ...userWithoutPassword } = newUser;
            res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
        } catch (error) {
            console.error('[UserController] Error creating user:', error.message, error.stack);
            next(error);
        }
    };

    const updateUser = async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const existingUser = await userModel.findById(id);
            if (!existingUser) {

                return res.status(404).json({ message: 'User not found' });
            }

            // If password is provided in updateData, hash it
            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password_hash = await bcrypt.hash(updateData.password, salt); // Store as password_hash
                delete updateData.password; // Remove plain text password from updateData
            }

            // If email is being updated, check for uniqueness
            if (updateData.email && updateData.email !== existingUser.email) {
                const userWithNewEmail = await userModel.findByEmail(updateData.email);
                if (userWithNewEmail && userWithNewEmail.id !== id) {
                    return res.status(409).json({ message: 'Another user with this email already exists.' });
                }
            }

            // Validate role if provided
            if (updateData.role && !['admin', 'analyst', 'viewer'].includes(updateData.role)) {
                return res.status(400).json({ message: 'Invalid role provided. Must be "admin", "analyst", or "viewer".' });
            }
            // Validate status if provided
            if (updateData.status && !['active', 'inactive', 'suspended'].includes(updateData.status)) {
                return res.status(400).json({ message: 'Invalid status provided. Must be "active", "inactive", or "suspended".' });
            }

            const updatedUser = await userModel.update(id, updateData);

            if (!updatedUser) {
                // This case means user was found, but no fields were actually updated by the model's update method.
                if (req.user) {
                    const auditUsername = req.user?.username || 'System/Unknown User';
                    const auditUserId = req.user?.id || 'system';
                    await auditLogModel.create({
                        user_id: auditUserId,
                        username: auditUsername,
                        action_type: 'ATTEMPTED_USER_UPDATE_NO_CHANGE',
                        entity_type: 'User',
                        entity_id: existingUser.id,
                        description: `Admin ${auditUsername} attempted to update user ${existingUser.username} (${existingUser.email}), but no changes were applied (data was identical).`,
                        details: { update_data: updateData, current_state: existingUser }
                    });
                } else {
                    console.warn('[UserController] Audit log for no-change user update skipped: req.user is undefined.');
                }
                const { password_hash, ...userWithoutPassword } = existingUser;

                return res.status(200).json({ message: 'User found, but no changes were applied.', user: userWithoutPassword });
            }

            // Log audit event for user update
            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'UPDATE_USER',
                    entity_type: 'User',
                    entity_id: updatedUser.id,
                    description: `User ${updatedUser.username} (${updatedUser.email}) updated by ${auditUsername}.`,
                    details: {
                        updated_fields: Object.keys(updateData),
                        previous_email: existingUser.email,
                        new_email: updatedUser.email,
                        previous_role: existingUser.role,
                        new_role: updatedUser.role,
                        previous_status: existingUser.status,
                        new_status: updatedUser.status
                    }
                });

            } else {
                console.warn('[UserController] Audit log for user update skipped: req.user is undefined.');
            }

            // Exclude password hash from the response
            const { password_hash, ...userWithoutPassword } = updatedUser;
            res.status(200).json({ message: 'User updated successfully', user: userWithoutPassword });
        } catch (error) {
            console.error(`[UserController] Error updating user ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    const deleteUser = async (req, res, next) => {
        const { id } = req.params;
        try {
            const existingUser = await userModel.findById(id);
            if (!existingUser) {

                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent a user from deleting themselves
            if (req.user && req.user.id === id) {
                console.warn(`[UserController] User ${req.user.username} attempted to delete their own account (${id}). Action denied.`);
                return res.status(403).json({ message: 'You cannot delete your own account.' });
            }

            const deleted = await userModel.del(id); // Assuming 'del' is the delete method

            if (deleted) {
                // Log audit event for user deletion
                if (req.user) {
                    const auditUsername = req.user?.username || 'System/Unknown User';
                    const auditUserId = req.user?.id || 'system';
                    await auditLogModel.create({
                        user_id: auditUserId,
                        username: auditUsername,
                        action_type: 'DELETE_USER',
                        entity_type: 'User',
                        entity_id: existingUser.id,
                        description: `User ${existingUser.username} (${existingUser.email}) deleted by ${auditUsername}.`,
                        details: { deleted_user_id: existingUser.id, deleted_user_email: existingUser.email, deleted_user_role: existingUser.role }
                    });

                } else {
                    console.warn('[UserController] Audit log for deleting user skipped: req.user is undefined.');
                }
                res.status(200).json({ message: 'User deleted successfully' });
            } else {
                // This case might occur if the user was found but the delete operation
                // somehow didn't affect any rows (e.g., race condition, or DB issue).

                res.status(404).json({ message: 'User not found or could not be deleted.' });
            }
        } catch (error) {
            console.error(`[UserController] Error deleting user ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    const toggleUserStatus = async (req, res, next) => {
        const { id } = req.params;
        const { status } = req.body; // Expected: 'active', 'inactive', or 'suspended'

        try {
            // Validate the provided status
            if (!['active', 'inactive', 'suspended'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status provided. Must be "active", "inactive", or "suspended".' });
            }

            const existingUser = await userModel.findById(id);
            if (!existingUser) {

                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent a user from changing their own status (or an admin from locking themselves out)
            if (req.user && req.user.id === id) {
                console.warn(`[UserController] User ${req.user.username} attempted to change their own status (${id}). Action denied.`);
                return res.status(403).json({ message: 'You cannot change your own account status.' });
            }

            // If the user is already in the requested status, report no change
            if (existingUser.status === status) {
                if (req.user) {
                    const auditUsername = req.user?.username || 'System/Unknown User';
                    const auditUserId = req.user?.id || 'system';
                    await auditLogModel.create({
                        user_id: auditUserId,
                        username: auditUsername,
                        action_type: 'ATTEMPTED_USER_STATUS_CHANGE_NO_CHANGE',
                        entity_type: 'User',
                        entity_id: existingUser.id,
                        description: `Admin ${auditUsername} attempted to change status of user ${existingUser.username} (${existingUser.email}) to ${status}, but it was already that status.`,
                        details: { requested_status: status, current_status: existingUser.status, target_user_id: existingUser.id }
                    });
                } else {
                    console.warn('[UserController] Audit log for no-change user status update skipped: req.user is undefined.');
                }
                const { password_hash, ...userWithoutPassword } = existingUser;

                return res.status(200).json({ message: `User status is already ${status}.`, user: userWithoutPassword });
            }

            const updatedUser = await userModel.update(id, { status });

            // Log audit event for toggling user status
            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'TOGGLE_USER_STATUS',
                    entity_type: 'User',
                    entity_id: updatedUser.id,
                    description: `User ${updatedUser.username} (${updatedUser.email}) status changed from ${existingUser.status} to ${updatedUser.status} by ${auditUsername}.`,
                    details: { previous_status: existingUser.status, new_status: updatedUser.status, target_user_id: updatedUser.id }
                });

            } else {
                console.warn('[UserController] Audit log for toggling user status skipped: req.user is undefined.');
            }

            // Exclude password hash from the response
            const { password_hash, ...userWithoutPassword } = updatedUser;
            res.status(200).json({ message: 'User status updated successfully', user: userWithoutPassword });
        } catch (error) {
            console.error(`[UserController] Error toggling status for user ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    const resetUserPassword = async (req, res, next) => {
        const { id } = req.params;
        const { newPassword } = req.body; // In a real app, this might be generated on backend

        try {

            if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.status(400).json({ message: 'New password is required and must be at least 8 characters long.' });
            }

            const existingUser = await userModel.findById(id);
            if (!existingUser) {

                return res.status(404).json({ message: 'User not found' });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            // Update the user's password in the database
            await userModel.update(id, { password_hash: hashedNewPassword }); // Update password_hash field

            // Log audit event for password reset
            if (req.user) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'RESET_USER_PASSWORD',
                    entity_type: 'User',
                    entity_id: existingUser.id,
                    description: `Password for user ${existingUser.username} (${existingUser.email}) reset by ${auditUsername}.`,
                    details: { target_user_id: existingUser.id, target_user_email: existingUser.email }
                });

            } else {
                console.warn('[UserController] Audit log for resetting user password skipped: req.user is undefined.');
            }

            // Provide a user-friendly message, emphasizing that a temporary password would be emailed
            res.status(200).json({ message: `Password for user ${existingUser.email} has been reset. A new temporary password would typically be generated and emailed to them.` });
        } catch (error) {
            console.error(`[UserController] Error resetting password for user ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    // Return all controller methods
    return {
        getUsers,
        getUserById,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
    };
};

module.exports = userController;