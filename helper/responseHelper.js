function responseHandler(res, status, message, data, success = true) {
    return res.status(status).json({ 
        "message": message,
        "data": data,
        "success": success
    });
}

module.exports = responseHandler;
