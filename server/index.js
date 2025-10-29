// This file is the entry point for Vercel serverless functions
const { app } = require('./App');

// Export the Express app for Vercel
module.exports = app;
