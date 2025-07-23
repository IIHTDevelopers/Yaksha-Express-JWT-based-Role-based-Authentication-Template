const request = require('supertest');
const express = require('express');
const mockingoose = require('mockingoose');
const jwt = require('jsonwebtoken');
const app = express();
const Hotel = require('../../models/hotel'); // Your Hotel model

const jwtSecret = 'your_jwt_secret_key';

// Controllers
const hotelController = require('../../controllers/hotelController');

// Middleware for role-based access (for admin routes)
const roleBasedAccessMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
        }
        next();
    };
};

// Create a JWT token (mock user with 'admin' role)
const generateToken = (user) => {
    return jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
};

// Mock hotel data
const mockHotelData = [
    { _id: '1', name: 'Hotel Sunshine', location: 'Paris', pricePerNight: 200 },
    { _id: '2', name: 'Hotel Mirage', location: 'New York', pricePerNight: 250 },
];

// Mock user data
const mockUserAdmin = { _id: '1', role: 'admin' };
const mockUserUser = { _id: '2', role: 'user' };

// Set up test Express app with routes
app.use(express.json());

// Mock hotel model for testing
mockingoose(Hotel).toReturn(mockHotelData, 'find');
mockingoose(Hotel).toReturn(mockHotelData[0], 'findOne');

// Routes
app.get('/api/hotels', hotelController.getAllHotels);
app.get('/api/hotels/:id', hotelController.getHotelById);
app.post('/api/hotels', roleBasedAccessMiddleware(['admin']), hotelController.createHotel);
app.put('/api/hotels/:id', roleBasedAccessMiddleware(['admin']), hotelController.updateHotel);

let hotelControllerBoundaryTest = `HotelController boundary test`;

// Tests
describe('Hotel Controller', () => {
    describe('boundary', () => {
        it(`${hotelControllerBoundaryTest} should return all hotels for GET /api/hotels`, async () => {
            const response = await request(app).get('/api/hotels');
            expect(response.status).toBe(200);
        });

        it(`${hotelControllerBoundaryTest} should return hotel by ID for GET /api/hotels/:id`, async () => {
            const response = await request(app).get('/api/hotels/1');
            expect(response.status).toBe(200);
        });

        it(`${hotelControllerBoundaryTest} should return 404 for non-existing hotel GET /api/hotels/:id`, async () => {
            mockingoose(Hotel).toReturn(null, 'findOne'); // Simulate no hotel found
            const response = await request(app).get('/api/hotels/999');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Hotel not found');
        });

        it(`${hotelControllerBoundaryTest} should return 403 for POST /api/hotels if user does not have admin role`, async () => {
            const userToken = generateToken(mockUserUser);
            const newHotel = {
                name: 'Hotel California',
                location: 'Los Angeles',
                pricePerNight: 300,
            };

            const response = await request(app)
                .post('/api/hotels')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newHotel);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Forbidden: You do not have the required role');
        });
    });
});
