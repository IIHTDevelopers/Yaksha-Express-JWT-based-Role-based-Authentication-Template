const mongoose = require('mongoose');
const User = require('../../models/user'); // Assuming the User model is in models/userModel.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');

let mongoServer;

beforeAll(async () => {
    // Create an in-memory MongoDB server instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    // Close the connection and stop the in-memory MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
});

let userModelBoundaryTest = `UserModel boundary test`;

describe('User Model', () => {
    describe('boundary', () => {
        it(`${userModelBoundaryTest} should create a new user successfully`, async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                passwordHash: 'john123',
                role: 'user',
            };

            const user = new User(userData);
            await user.save();

            // Check if the user data is saved
            expect(user.name).toBe(userData.name);
            expect(user.email).toBe(userData.email);
            expect(user.role).toBe(userData.role);
            expect(user.passwordHash).not.toBe(userData.passwordHash);  // Ensure password is hashed
            expect(user._id).toBeDefined();
        });

        it(`${userModelBoundaryTest} should throw an error if required fields are missing`, async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'user',
            };

            const user = new User(userData);

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.passwordHash).toBeDefined(); // 'passwordHash' is a required field
        });

        it(`${userModelBoundaryTest} should hash the password before saving`, async () => {
            const userData = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                passwordHash: 'jane123',
                role: 'admin',
            };

            const user = new User(userData);
            await user.save();

            // Check that the password is hashed
            const isPasswordHashed = await bcrypt.compare('jane123', user.passwordHash);
            expect(isPasswordHashed).toBe(true);
        });

        it(`${userModelBoundaryTest} should compare passwords correctly`, async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                passwordHash: 'password123',
                role: 'user',
            };

            const user = new User(userData);
            await user.save();

            // Compare the password with the stored hash
            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        it(`${userModelBoundaryTest} should throw an error if email is already in use`, async () => {
            const userData = {
                name: 'Existing User',
                email: 'existing@example.com',
                passwordHash: 'password123',
                role: 'user',
            };

            // Create the first user
            const user1 = new User(userData);
            await user1.save();

            // Try to create another user with the same email
            const user2 = new User(userData);

            let error;
            try {
                await user2.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // MongoDB duplicate key error code
        });
    });
});
