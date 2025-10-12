

const errorHandler = (err, req, res, next) => {
    // Log the error details to the server console for debugging.
    // We prioritize `err.stack` for detailed stack traces, falling back to `err.message`.
    console.error('--- Global Error Handler ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Request Path:', req.path);
    console.error('Request Method:', req.method);
    console.error('Request Body (if present):', req.body); // Be cautious with logging sensitive data
    console.error('----------------------------');

    // Determine the HTTP status code for the response.
    // If the error object has a `statusCode` property (e.g., from custom error classes), use it.
    // Otherwise, default to 500 Internal Server Error.
    const statusCode = err.statusCode || 500;

    // Send a JSON response to the client.
    // The `success` field is set to `false` to indicate an error.
    // The `message` field provides a user-friendly error message.
    // In a production environment, you might want to send a generic message for 500 errors
    // to avoid exposing sensitive internal details.
    res.status(statusCode).json({
        success: false,
        message: err.message || 'An unexpected server error occurred. Please try again later.',
        // Optionally, include more details in development for debugging:
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // It's generally not necessary to call `next(err)` in the final error handler,
    // as it signifies the end of the request-response cycle for this error.
    // However, including `next` in the signature is standard for Express error middleware.
};

module.exports = errorHandler;
