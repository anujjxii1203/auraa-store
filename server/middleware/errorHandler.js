const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);
  
  if (err.message && err.message.startsWith('CORS blocked')) {
    res.status(403).json({ message: err.message });
    return;
  }

  if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') { // SQLite or Postgres unique constraint
    res.status(409).json({ message: 'This record conflicts with existing data.' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
