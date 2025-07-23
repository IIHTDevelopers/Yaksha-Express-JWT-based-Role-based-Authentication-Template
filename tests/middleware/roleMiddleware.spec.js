const request = require('supertest');
const express = require('express');
const roleBasedAccessMiddleware = require('../../middleware/roleMiddleware'); // Path to your middleware

// Create a test Express app
const app = express();
app.use(express.json());

// Mock user data with different roles
const mockUserAdmin = { _id: '1', role: 'admin' };
const mockUserUser = { _id: '2', role: 'user' };

// Test routes
app.get('/admin-protected', roleBasedAccessMiddleware(['admin']), (req, res) => {
    res.status(200).json({ message: 'Admin has access!' });
});

app.get('/user-protected', roleBasedAccessMiddleware(['user']), (req, res) => {
    res.status(200).json({ message: 'User has access!' });
});

// Mock the user on the request (usually added by auth middleware)
app.use((req, res, next) => {
    req.user = mockUserAdmin; // Set the user to mock admin user for testing
    next();
});

let roleMiddlewareBoundaryTest = `RoleMiddleware boundary test`;

describe('Role Middleware', () => {
    describe('boundary', () => {

        it(`${roleMiddlewareBoundaryTest} should return 403 if user does not have the required role for admin-only route`, async () => {
            // Change mock user role to 'user' to test the forbidden case
            app.use((req, res, next) => {
                req.user = mockUserUser; // Set the user to mock user role
                next();
            });

            const response = await request(app).get('/admin-protected');
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Forbidden: You do not have the required role');
        });

        it(`${roleMiddlewareBoundaryTest} should return 403 if user does not have the required role for user-only route`, async () => {
            // Change mock user role to 'admin'
            app.use((req, res, next) => {
                req.user = mockUserAdmin; // Set the user to mock admin role
                next();
            });

            const response = await request(app).get('/user-protected');
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Forbidden: You do not have the required role');
        });

        it(`${roleMiddlewareBoundaryTest} should return 403 if no user object is present in the request`, async () => {
            // Remove user from request to simulate the missing user scenario
            app.use((req, res, next) => {
                req.user = null; // Simulate no user object
                next();
            });

            const response = await request(app).get('/admin-protected');
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Forbidden: You do not have the required role');
        });
    });
});
