const sendSuccess = (res, { message = 'Success', data, statusCode = 200 } = {}) => {
    const body = { success: true, message };
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
