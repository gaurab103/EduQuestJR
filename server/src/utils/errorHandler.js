export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
}
