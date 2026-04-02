"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
        const end = process.hrtime(start);
        const duration = (end[0] * 1000 + end[1] / 1e6).toFixed(2); // Convert to milliseconds
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
