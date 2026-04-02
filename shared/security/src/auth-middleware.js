"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = exports.validateApiKey = void 0;
const uuid_1 = require("uuid");
// In a real application, API keys would be stored securely (e.g., database, environment variables)
// and hashed. For this example, we'll use a simple in-memory store.
const VALID_API_KEYS = new Set(process.env.API_KEYS ? process.env.API_KEYS.split(',') : []);
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).send({ message: 'Unauthorized: X-API-Key header missing' });
    }
    if (!VALID_API_KEYS.has(apiKey)) {
        return res.status(403).send({ message: 'Forbidden: Invalid API Key' });
    }
    next();
};
exports.validateApiKey = validateApiKey;
const generateApiKey = () => {
    const newKey = (0, uuid_1.v4)();
    VALID_API_KEYS.add(newKey);
    console.log(`Generated new API Key: ${newKey}`);
    return newKey;
};
exports.generateApiKey = generateApiKey;
// Example of how to add an initial API key if none are provided
if (VALID_API_KEYS.size === 0) {
    console.warn("No API_KEYS environment variable found. Generating a default API key for development.");
    (0, exports.generateApiKey)(); // Generate one for testing if not set via env
}
