// middleware/errorHandler.js

function errorHandler(err, req, res, next) {

    console.error("Error:", err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: err.message || "Internal Server Error",

        // Show stack only in development
        stack:
            process.env.NODE_ENV === "development"
                ? err.stack
                : undefined
    });
}

module.exports = errorHandler;