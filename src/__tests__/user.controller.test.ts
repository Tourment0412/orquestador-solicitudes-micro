import request from 'supertest';
import express, { Express } from 'express';
import router from '../routes/user.routes';
import { User } from '../models/user.model';

// Mock dependencies before importing
jest.mock('../services/user.service', () => ({
  createUser: jest.fn(),
  getAllUsers: jest.fn(),
}));

jest.mock('../repositories/user.repository');
jest.mock('../infrastructure/publisher');

// Import after mocks
import * as userService from '../services/user.service';

const mockedUserService = userService as jest.Mocked<typeof userService>;

describe('UserController - Happy Path Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/users', router);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/v1/users', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        name: userData.name,
        createdAt: new Date().toISOString()
      };

      (mockedUserService.createUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(mockedUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockedUserService.createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users successfully', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'Test User 1',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'Test User 2',
          createdAt: new Date().toISOString()
        }
      ];

      (mockedUserService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].email).toBe(mockUsers[0].email);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

});

