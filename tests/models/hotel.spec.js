const mongoose = require('mongoose');
const Hotel = require('../../models/hotel'); // Your Hotel model
const { MongoMemoryServer } = require('mongodb-memory-server');

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

let hotelModelBoundaryTest = `HotelModel boundary test`;

describe('Hotel Model', () => {
    describe('boundary', () => {
        it(`${hotelModelBoundaryTest} should create a new hotel successfully`, async () => {
            const hotelData = {
                name: 'Hotel California',
                location: 'Los Angeles',
                pricePerNight: 300,
            };

            const hotel = new Hotel(hotelData);
            await hotel.save();

            expect(hotel.name).toBe(hotelData.name);
            expect(hotel.location).toBe(hotelData.location);
            expect(hotel.pricePerNight).toBe(hotelData.pricePerNight);
            expect(hotel._id).toBeDefined();
        });

        it(`${hotelModelBoundaryTest} should throw an error if required fields are missing`, async () => {
            const hotelData = {
                location: 'New York',
                pricePerNight: 250,
            };

            const hotel = new Hotel(hotelData);

            let error;
            try {
                await hotel.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.name).toBeDefined(); // 'name' is a required field
        });

        it(`${hotelModelBoundaryTest} should fetch a hotel by name`, async () => {
            const hotelData = {
                name: 'Hotel Sunset',
                location: 'Miami',
                pricePerNight: 150,
            };

            const hotel = new Hotel(hotelData);
            await hotel.save();

            const fetchedHotel = await Hotel.findOne({ name: hotelData.name });
            expect(fetchedHotel).toBeDefined();
            expect(fetchedHotel.name).toBe(hotelData.name);
            expect(fetchedHotel.location).toBe(hotelData.location);
            expect(fetchedHotel.pricePerNight).toBe(hotelData.pricePerNight);
        });

        it(`${hotelModelBoundaryTest} should update a hotel successfully`, async () => {
            const hotelData = {
                name: 'Hotel Sunset',
                location: 'Miami',
                pricePerNight: 150,
            };

            const hotel = new Hotel(hotelData);
            await hotel.save();

            // Update the hotel data
            const updatedData = { name: 'Hotel Sunrise', location: 'Orlando', pricePerNight: 180 };
            hotel.name = updatedData.name;
            hotel.location = updatedData.location;
            hotel.pricePerNight = updatedData.pricePerNight;

            await hotel.save();

            const updatedHotel = await Hotel.findById(hotel._id);
            expect(updatedHotel.name).toBe(updatedData.name);
            expect(updatedHotel.location).toBe(updatedData.location);
            expect(updatedHotel.pricePerNight).toBe(updatedData.pricePerNight);
        });

        it(`${hotelModelBoundaryTest} should delete a hotel successfully`, async () => {
            const hotelData = {
                name: 'Hotel Sunset',
                location: 'Miami',
                pricePerNight: 150,
            };

            const hotel = new Hotel(hotelData);
            await hotel.save();

            const hotelId = hotel._id;

            // Delete the hotel
            await hotel.delete();

            const deletedHotel = await Hotel.findById(hotelId);
            expect(deletedHotel).toBeNull();
        });
    });
});
