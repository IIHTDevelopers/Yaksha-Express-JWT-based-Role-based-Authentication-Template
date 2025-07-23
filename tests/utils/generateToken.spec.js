const jwt = require('jsonwebtoken');
const generateToken = require('../../utils/generateToken'); // Assuming the function is in the same directory

// Mock the JWT secret so we can test
const jwtSecret = 'your_jwt_secret_key';

let generateTokenBoundaryTest = `GenerateToken boundary test`;

describe('Generate Token', () => {
    describe('boundary', () => {
        it(`${generateTokenBoundaryTest} should generate a valid JWT token with correct payload`, () => {
            // Mock user data
            const user = {
                id: 1,
                email: 'john@example.com',
                role: 'user',
            };

            // Generate the token using the generateToken function
            const token = generateToken(user);

            // Decode the token to verify the payload
            const decoded = jwt.verify(token, jwtSecret);

            // Assertions
            expect(decoded.id).toBe(user.id);
            expect(decoded.email).toBe(user.email);
            expect(decoded.role).toBe(user.role);
            expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000)); // Token expiration time is in the future
        });

        it(`${generateTokenBoundaryTest} should throw an error if no user data is passed`, () => {
            // Try generating a token with no user object
            expect(() => generateToken()).toThrow(); // Should throw an error because user data is required
        });
    });
});
