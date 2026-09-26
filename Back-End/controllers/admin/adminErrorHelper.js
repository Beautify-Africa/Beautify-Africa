function handleAdminError(error, res, fallbackMessage, logLabel) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? fallbackMessage : error.message;

  if (statusCode === 500) {
    console.error(`${logLabel} error:`, error);
  }

  return res.status(statusCode).json({
    status: 'error',
    message,
  });
}

module.exports = {
  handleAdminError,
};
