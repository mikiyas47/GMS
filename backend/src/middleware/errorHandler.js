function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    // Mongoose Duplicate Key Error (Unique Constraint Violation)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        const readableField = field.replace(/_/g, ' ');
        return res.status(409).json({
            success: false,
            message: `A record with this ${readableField} (${value}) already exists. Duplicate values are not permitted.`
        });
    }

    if (err.name === 'ValidationError') {
        const firstError = Object.values(err.errors || {})[0]?.message || err.message;
        return res.status(400).json({
            success: false,
            message: firstError,
            errors: err.errors
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error occurred';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
}

module.exports = errorHandler;
