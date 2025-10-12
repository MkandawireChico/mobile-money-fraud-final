

// This file now exports a function that takes the initialized userModel and jwt as arguments
module.exports = (userModel, jwt) => { // <-- Key change: Accept userModel and jwt as arguments

    const protect = async (req, res, next) => {
        let token;

        // Check if the Authorization header is present and starts with 'Bearer'
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                // Extract the token from the 'Bearer <token>' string
                token = req.headers.authorization.split(' ')[1];

                // Verify the token using the JWT_SECRET from environment variables
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Find the user in the database using the ID from the decoded token
                // userModel is now the injected instance, which has access to the pool
                const user = await userModel.findById(decoded.id);

                // If user is not found in the database, token is invalid or user no longer exists
                if (!user) {
                    console.warn('[AuthMiddleware] User not found in DB for token ID:', decoded.id);
                    return res.status(401).json({ message: 'Not authorized: User associated with token not found.' });
                }

                // Exclude the password hash from the user object before attaching it to the request
                const { password_hash, ...userWithoutPassword } = user;
                req.user = userWithoutPassword; // Attach the user object (without sensitive data) to the request

                // Proceed to the next middleware/route handler
                next();
            } catch (error) {
                // Log the error for debugging purposes
                console.error('[AuthMiddleware] Token verification failed:', error.message);

                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Not authorized: Token expired. Please log in again.' });
                }
                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({ message: 'Not authorized: Invalid token. Please log in again.' });
                }

                if (error.message && (error.message.includes('timeout') || error.message.includes('Connection terminated'))) {
                    console.error('[AuthMiddleware] Database connection issue during token verification:', error.message);
                    return res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' });
                }

                // Generic error for other token failures
                return res.status(401).json({ message: 'Not authorized: Token validation failed.' });
            }
        } else {
            // If no token is provided in the expected format
            console.warn('[AuthMiddleware] No token provided or invalid format in Authorization header.');
            return res.status(401).json({ message: 'Not authorized: No token provided.' });
        }
    };

    const authorize = (allowedRoles) => {
        return (req, res, next) => {

            // Check if req.user exists and if the user's role is included in the allowed roles
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                console.warn(`[AuthMiddleware] Access Denied: User "${req.user?.username || 'unknown'}" (Role: ${req.user?.role || 'unknown'}) attempted to access a forbidden route.`);
                return res.status(403).json({ message: `Forbidden: Your role (${req.user?.role || 'unknown'}) is not authorized to access this resource.` });
            }
            // If authorized, proceed to the next middleware/route handler
            next();
        };
    };

    // Specific role-checking middleware functions for common use cases
    const checkAdminRole = authorize(['admin']);
    const checkAdminAnalystRole = authorize(['admin', 'analyst']);
    const checkAllRoles = authorize(['admin', 'analyst', 'viewer']); // For routes accessible by all standard roles

    return { // <-- Key change: Return an object containing the functions
        protect,
        authorize,
        checkAdminRole,
        checkAdminAnalystRole,
        checkAllRoles,
    };
};
