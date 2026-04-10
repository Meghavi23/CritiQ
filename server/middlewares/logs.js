// const { isEmpty, getCurrentTimeStampWithMs } = require('../utils/utils');
const { format } = require('date-fns');
const now = require('performance-now');
const { isJsonStr } = require('../lib/helper');
const port = process.env.PORT || 4000;

function getCurrentTimeStampWithMs() {
    return `${format(new Date(), 'yyyy-MM-ddTHH:mm:ss.SSS')}Z`;
}

function isEmpty(str) {
    let string = typeof str === 'string' ? str.replace(/\s/g, '') : str;
    string = typeof string === 'number' ? string.toString() : string;
    string = isJsonObj(string) && Object.keys(string)?.length === 0 ? '' : string;
    string = isJsonStr(string) && Object.keys(JSON.parse(string))?.length === 0 ? '' : string;
    return typeof string === 'undefined' || !string || string?.length === 0 || string === '' || string === '0000-00-00 00:00:00' || string === null;
}

function createUserApiLog(req, res) {
    const jsonReq = res.locals.jsonReq;
    if (!isEmpty(jsonReq)) {
        const { requestId, auditApp, appVersion, apiName, ip } = res.locals.auditPDetail;

        const resBody = res.locals.resBody;
        const startTime = res.locals.startTime;
        const startTimeStamp = res.locals.startTimeStamp;
        const executionTime = (now() - startTimeStamp).toFixed(3) + 'ms';
        const endTime = format(new Date(), 'HH:mm:ss.SSS');
        const executionLog = { startTime, endTime, executionTime };

        const logData = {
            timeStamp: getCurrentTimeStampWithMs(),
            requestId,
            apiName,
            port,
            type: 'auditApi',
            apiDetail: {
                statusCode: res.statusCode,
                request: jsonReq,
                response: resBody,
                benchmark: executionLog
            }
        };

        logData.type = 'auditApi';
        logData.auditPDetail = auditApp;
        if (appVersion !== '0') logData.appVersion = appVersion;
        logData.ip = ip;

        logger.log({
            level: res.statusCode >= 300 ? 'error' : 'info',
            message: logData
        });
    } else {    
        console.log('res.locals is null');
    }
}

function auditPersonJson(req, requestId) {
    return {
        requestId,
        auditApp: isEmpty(req.headers['app-flavour']) ? 'Postman' : req.headers['app-flavour'],
        appVersion: isEmpty(req.headers['app-version-code']) ? '0' : req.headers['app-version-code'],
        apiName: req.originalUrl.replace(/\?.*$/, '').replace('/' + process.env.ROUTE + '/', ''),
        ip: req.clientIp
    };
}

module.exports = {
    createUserApiLog,
    auditPersonJson
};
