function success(res, message, data = null, statusCode = 200) {
  const body = {
    success: true,
    message
  };

  if (data !== null) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
}

function error(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  success,
  error
};