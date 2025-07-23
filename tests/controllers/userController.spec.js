const request = require('supertest');
const express = require('express');
const mockingoose = require('mockingoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../models/user'); // Assuming User model is in models/userModel.js

const jwtSecret = 'your_jwt_secret_key';

const userController = require('../../controllers/userController');

// Create an Express app for testing
const app = express();
app.use(express.json());

// Mock user data for testing
const mockUserData = {
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: 'hashedpassword',
    role: 'user',
};

// Mocked user with an 'admin' role for testing login
const mockAdminUser = {
    _id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: 'hashedpassword',
    role: 'admin',
};

// Mock password hashing function (bcrypt)
jest.mock('bcrypt');
bcrypt.compare = jest.fn();

// Mock JWT signing function
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mocked-jwt-token'),
}));

// Set up mockingoose for the User model
mockingoose(User).toReturn(mockUserData, 'findOne');
mockingoose(User).toReturn(mockAdminUser, 'findOne');

// Routes for testing
app.post('/api/users/register', userController.registerUser);
app.post('/api/users/login', userController.loginUser);

let userControllerBoundaryTest = `UserController boundary test`;

describe('User Controller', () => {
    // Test User Registration
    describe('boundary', () => {

        it(`${userControllerBoundaryTest} should return 400 if the user already exists`, async () => {
            const existingUser = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'user',
            };

            const response = await request(app).post('/api/users/register').send(existingUser);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('User already exists');
        });

        it(`${userControllerBoundaryTest} should login a user and return a JWT token`, async () => {
            // Mock bcrypt.compare to return true (password matches)
            bcrypt.compare.mockResolvedValue(true);

            const loginData = {
                email: 'john@example.com',
                password: 'password123',
            };

            const response = await request(app).post('/api/users/login').send(loginData);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBe('mocked-jwt-token');
        });

        it(`${userControllerBoundaryTest} should return 400 for invalid credentials (wrong password)`, async () => {
            // Mock bcrypt.compare to return false (password does not match)
            bcrypt.compare.mockResolvedValue(false);

            const loginData = {
                email: 'john@example.com',
                password: 'wrongpassword',
            };

            const response = await request(app).post('/api/users/login').send(loginData);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it(`${userControllerBoundaryTest} should return 400 if the user does not exist`, async () => {
            mockingoose(User).toReturn(null, 'findOne');

            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const response = await request(app).post('/api/users/login').send(loginData);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it(`${userControllerBoundaryTest} should return 500 if there is a server error`, async () => {
            mockingoose(User).toReturn(new Error('Server error'), 'findOne');

            const loginData = {
                email: 'john@example.com',
                password: 'password123',
            };

            const response = await request(app).post('/api/users/login').send(loginData);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Server error');
        });
    });
});
