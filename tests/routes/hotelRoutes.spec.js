const request = require('supertest');
const app = require('../../app');  // Your Express app
const mockingoose = require('mockingoose');
const Hotel = require('../../models/hotel');
const User = require('../../models/user');
const jwt = require('jsonwebtoken');

const jwtSecret = 'your_jwt_secret_key';

// Mock data for hotels
const hotelData = [
  { id: 1, name: 'Hotel Sunshine', location: 'Paris', pricePerNight: 200 },
  { id: 2, name: 'Hotel Mirage', location: 'New York', pricePerNight: 250 },
];

// Mock data for users (with admin role)
const adminUser = {
  _id: '609c72ef88a5b3443a8a4d43',
  email: 'admin@example.com',
  passwordHash: 'hashedpassword',
  role: 'admin',
};

// JWT token generation for admin user
const generateToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
};

// Mock Hotel model for testing
mockingoose(Hotel).toReturn(hotelData, 'find');
mockingoose(User).toReturn(adminUser, 'findOne');

let hotelRoutesBoundaryTest = `HotelRoutes boundary test`;

describe('Hotel Routes', () => {
  // Public routes testing
  describe('boundary', () => {
    const adminToken = generateToken(adminUser);

    it(`${hotelRoutesBoundaryTest} should return all hotels for GET /hotels`, async () => {
      const response = await request(app).get('/api/hotels');
      expect(response.status).toBe(200);
    });

    it(`${hotelRoutesBoundaryTest} should return 404 for non-existing hotel GET /hotels/:id`, async () => {
      const response = await request(app).get('/api/hotels/999');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hotel not found');
    });

    it(`${hotelRoutesBoundaryTest} should create a hotel for POST /hotels with admin token`, async () => {
      const newHotel = {
        name: 'Hotel California',
        location: 'Los Angeles',
        pricePerNight: 300,
      };

      const response = await request(app)
        .post('/api/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newHotel);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Hotel created successfully');
      expect(response.body.hotel).toHaveProperty('name', newHotel.name);
    });

    it(`${hotelRoutesBoundaryTest} should return 401 for POST /hotels without authorization`, async () => {
      const newHotel = {
        name: 'Hotel California',
        location: 'Los Angeles',
        pricePerNight: 300,
      };

      const response = await request(app).post('/api/hotels').send(newHotel);
      expect(response.status).toBe(401);
    });

    it(`${hotelRoutesBoundaryTest} should return 403 for POST /hotels with non-admin JWT`, async () => {
      const nonAdminUser = { _id: '609c72ef88a5b3443a8a4d44', role: 'user' };
      const nonAdminToken = generateToken(nonAdminUser);

      const newHotel = {
        name: 'Hotel California',
        location: 'Los Angeles',
        pricePerNight: 300,
      };

      const response = await request(app)
        .post('/api/hotels')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(newHotel);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden: You do not have the required role');
    });

    it(`${hotelRoutesBoundaryTest} should return 401 for PUT /hotels/:id without authorization`, async () => {
      const updatedHotel = {
        name: 'Updated Hotel Sunshine',
        location: 'Updated Paris',
        pricePerNight: 220,
      };

      const response = await request(app).put('/api/hotels/1').send(updatedHotel);
      expect(response.status).toBe(401);
    });

    it(`${hotelRoutesBoundaryTest} should return 403 for PUT /hotels/:id with non-admin JWT`, async () => {
      const nonAdminUser = { _id: '609c72ef88a5b3443a8a4d44', role: 'user' };
      const nonAdminToken = generateToken(nonAdminUser);

      const updatedHotel = {
        name: 'Updated Hotel Sunshine',
        location: 'Updated Paris',
        pricePerNight: 220,
      };

      const response = await request(app)
        .put('/api/hotels/1')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(updatedHotel);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden: You do not have the required role');
    });
  });
});
