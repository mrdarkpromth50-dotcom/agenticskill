import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs?: number; // milliseconds
  max?: number; // max requests per windowMs
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

export const createRateLimiter = (options?: RateLimiterOptions) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute',
    statusCode: 429,
    headers: true,
  };

  const limiter = rateLimit({
    ...defaultOptions,
    ...options,
    handler: (req: Request, res: Response, next: NextFunction) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(defaultOptions.statusCode).send({ message: defaultOptions.message });
    },
  });

  console.log(`Rate Limiter initialized: Max ${defaultOptions.max} requests per ${defaultOptions.windowMs / 1000} seconds.`);
  return limiter;
};
