const { printErrorLog, formatErrorString } = require("./helper");

exports.wrapAsync = (func) => async (req, res, next) => {
    try {
        await func(req, res);
    } catch (error) {
        console.log({ error: error.response });

        printErrorLog(`${req.originalUrl} catch: ` + formatErrorString(error));
        return next(error);
    }
};
