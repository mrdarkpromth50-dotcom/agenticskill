"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const createRateLimiter = (options) => {
    const defaultOptions = {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again after a minute',
        statusCode: 429,
        headers: true,
    };
    const limiter = (0, express_rate_limit_1.default)({
        ...defaultOptions,
        ...options,
        handler: (req, res, next) => {
            console.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(defaultOptions.statusCode).send({ message: defaultOptions.message });
        },
    });
    console.log(`Rate Limiter initialized: Max ${defaultOptions.max} requests per ${defaultOptions.windowMs / 1000} seconds.`);
    return limiter;
};
exports.createRateLimiter = createRateLimiter;
