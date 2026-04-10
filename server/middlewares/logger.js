const winston = require("winston");
const expressWinston = require("express-winston");
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require("../config/config");

const isProd = config.server.nodeEnv === 'PROD';

const logsDirectory = path.join(__dirname, '..', '..', 'logs');
const expressLogsDirectory = path.join(logsDirectory, 'express');
const expressErrorsLogsDirectory = path.join(logsDirectory, 'express-errors');

// ensure log directory exists
fs.existsSync(expressLogsDirectory) || fs.mkdirSync(expressLogsDirectory, { recursive: true });
fs.existsSync(expressErrorsLogsDirectory) || fs.mkdirSync(expressErrorsLogsDirectory, { recursive: true });

const tsFormat = () => new Date().toLocaleTimeString();

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
);

const colorLine = winston.format.printf((info) => {
    const meta = info.meta || {};
    const req = meta.req || {};
    const res = meta.res || {};

    const method = req.method || "-";
    const url = req.originalUrl || req.url || "-";
    const status = res.statusCode || meta.res?.statusCode || 0;
    const time = meta.responseTime || "-";

    let color = "\x1b[37m"; // white default

    // Status coloring (priority)
    if (status >= 500) color = "\x1b[31m"; // red
    else if (status >= 400) color = "\x1b[33m"; // yellow
    else {
        // Method coloring
        if (method === "GET") color = "\x1b[34m"; // blue
        else if (method === "POST") color = "\x1b[32m"; // green
        else if (method === "PUT" || method === "PATCH") color = "\x1b[33m"; // yellow
        else if (method === "DELETE") color = "\x1b[31m"; // red
    }

    return `${color}${method} ${url} ${status} ${time}ms\x1b[0m`;
});

const expressLogger = expressWinston.logger({
    transports: [new winston.transports.Console()],
    // IMPORTANT: enable meta so we can access req/res safely
    meta: true,
    // Keep meta small (so you don't dump headers/body)
    requestWhitelist: ["method", "url", "originalUrl"],
    responseWhitelist: ["statusCode"],
    dynamicMeta: (req, res) => ({
        req: { method: req.method, url: req.url, originalUrl: req.originalUrl },
        res: { statusCode: res.statusCode },
        responseTime: res.responseTime,
    }),
    format: winston.format.combine(colorLine),
});

// Creating own logger object to use all over project
const logger = winston.createLogger({
    format: logFormat,
    defaultMeta: { service: 'user-service' },
    transports: [
        new DailyRotateFile({
            filename: `${expressLogsDirectory}/express-logs.log`,
            timestamp: tsFormat,
            datePattern: 'YYYY-MM-DD',
            prepend: true
        })
    ]
});

// For Logging Errors via Middleware
const expressErrorLogger = expressWinston.errorLogger({
    format: logFormat,
    transports: [
        new DailyRotateFile({
            filename: `${expressErrorsLogsDirectory}/error-logs.log`,
            timestamp: tsFormat,
            handleExceptions: true,
            datePattern: 'YYYY-MM-DD',
            prepend: true,
            level: isProd ? 'info' : 'verbose'
        })
    ],
    exitOnError: false // If false, handled exceptions will not cause process.exit
});

module.exports = { expressLogger, logger, expressErrorLogger };