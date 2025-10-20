module.exports = (statusCode = 500, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
