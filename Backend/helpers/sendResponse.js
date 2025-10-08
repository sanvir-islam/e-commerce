const sendResponse = (res, { success, message, status = 200, data = null, errors = null }) => {
  const payload = { success, message };
  if (data) payload.data = data;
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

module.exports = sendResponse;
