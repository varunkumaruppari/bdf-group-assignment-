/**
 * Centralized Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  // Log error in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error('API Error:', err);
  }

  // Handle custom status codes
  if (err.status || err.statusCode) {
    const statusCode = err.status || err.statusCode;
    return res.status(statusCode).json({
      error: err.message || 'An error occurred'
    });
  }

  // Handle SQLite specific constraint errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message && err.message.includes('UNIQUE constraint failed: lockers.name')) {
      return res.status(409).json({
        error: 'A locker with this name already exists'
      });
    }
    if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({
        error: 'Invalid reference: referenced member or locker does not exist'
      });
    }
    return res.status(409).json({
      error: 'Database constraint violation: duplicate or conflicting data'
    });
  }

  // Default internal server error
  return res.status(500).json({
    error: 'Internal server error'
  });
}

module.exports = errorHandler;

