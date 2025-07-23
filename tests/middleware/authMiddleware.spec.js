const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware'); // Path to your middleware

const jwtSecret = 'your_jwt_secret_key';

// Create a test Express app
const app = express();
app.use(express.json());

// Mock the JWT secret
const validToken = jwt.sign({ userId: '1', role: 'admin' }, jwtSecret, { expiresIn: '1h' });
const invalidToken = 'invalid_token';

// Test routes
app.get('/protected', authMiddleware('admin'), (req, res) => {
    res.status(200).json({ message: 'You have access!' });
});

app.get('/user-protected', authMiddleware('user'), (req, res) => {
    res.status(200).json({ message: 'User has access!' });
});

let authMiddlewareBoundaryTest = `AuthMiddleware boundary test`;

// Mocking JWT verify to simulate behavior in tests
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    describe('boundary', () => {
        it(`${authMiddlewareBoundaryTest} should return 401 if the Authorization header is missing`, async () => {
            const response = await request(app).get('/protected');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Authorization token is missing or malformed');
        });

        it(`${authMiddlewareBoundaryTest} should return 401 if the Authorization header is malformed`, async () => {
            const response = await request(app).get('/protected').set('Authorization', 'BearerMalformedToken');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Authorization token is missing or malformed');
        });

        it(`${authMiddlewareBoundaryTest} should return 401 if the JWT is invalid or expired`, async () => {
            // Simulate an invalid token
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            const response = await request(app).get('/protected').set('Authorization', `Bearer ${invalidToken}`);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid or expired token');
        });
    });
});
