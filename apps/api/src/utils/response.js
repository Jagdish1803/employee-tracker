function successResponse(res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...meta,
  });
}

function errorResponse(res, message, statusCode = 400, errors = null) {
  const body = {
    success: false,
    error: message,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

function paginatedResponse(res, data, total, page, limit) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
