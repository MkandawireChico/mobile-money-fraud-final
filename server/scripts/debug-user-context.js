#!/usr/bin/env node
/**
 * Debug script to check user context in API calls
 */

// Add this middleware to your routes temporarily to debug
const debugUserContext = (req, res, next) => {
    console.log('🔍 Debug User Context:');
    console.log('- User Object:', req.user);
    console.log('- User Role:', req.user?.role);
    console.log('- User ID:', req.user?.id);
    console.log('- Headers:', req.headers.authorization);
    console.log('---');
    next();
};

console.log('Add this middleware to your transaction routes to debug:');
console.log(`
// In transactionRoutes.js, add this before your route handlers:
const debugUserContext = (req, res, next) => {
    console.log('🔍 Debug User Context:');
    console.log('- User Object:', req.user);
    console.log('- User Role:', req.user?.role);
    console.log('- User ID:', req.user?.id);
    console.log('---');
    next();
};

// Then use it like:
router.get('/', protect, authorize(['admin', 'analyst', 'viewer']), debugUserContext, getAllTransactions);
`);

module.exports = { debugUserContext };
