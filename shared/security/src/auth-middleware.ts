import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// In a real application, API keys would be stored securely (e.g., database, environment variables)
// and hashed. For this example, we'll use a simple in-memory store.
const VALID_API_KEYS = new Set<string>(process.env.API_KEYS ? process.env.API_KEYS.split(',') : []);

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).send({ message: 'Unauthorized: X-API-Key header missing' });
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    return res.status(403).send({ message: 'Forbidden: Invalid API Key' });
  }

  next();
};

export const generateApiKey = (): string => {
  const newKey = uuidv4();
  VALID_API_KEYS.add(newKey);
  console.log(`Generated new API Key: ${newKey}`);
  return newKey;
};

// Example of how to add an initial API key if none are provided
if (VALID_API_KEYS.size === 0) {
  console.warn("No API_KEYS environment variable found. Generating a default API key for development.");
  generateApiKey(); // Generate one for testing if not set via env
}
