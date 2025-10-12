

const errorHandler = (err, req, res, next) => {
    // Determine the HTTP status code for the response.
    // If a status code was already set on the response (e.g., by a previous middleware
    // or route handler using `res.status()`), use that. Otherwise, default to 500
    // (Internal Server Error) for unhandled exceptions.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Set the HTTP status code on the response.
    res.status(statusCode);

    // Log the error details to the server console for debugging.
    // This provides server-side visibility into what went wrong.
    console.error('--- Global Error Middleware ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Request Path:', req.path);
    console.error('Request Method:', req.method);
    // In development, log the full stack trace for easier debugging.
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error Stack:', err.stack);
    }
    console.error('-------------------------------');

    // Send a JSON response to the client with the error details.
    // In production, avoid sending sensitive stack traces to clients.
    res.json({
        success: false, // Indicate that the request was not successful
        message: err.message || 'An unexpected server error occurred.', // User-friendly error message
        // Include stack trace only in non-production environments
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });

    // In a global error handler, `next(err)` is typically not called, as this middleware
    // is intended to terminate the request-response cycle by sending a response.
    // However, keeping `next` in the signature is standard Express practice.
};

module.exports = errorHandler;
