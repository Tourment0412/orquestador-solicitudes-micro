import request from 'supertest';
import express, { Express } from 'express';
import userRoutes from '../../routes/user.routes';
import * as userController from '../../controllers/user.controller';

// Mock del controlador
jest.mock('../../controllers/user.controller');

describe('User Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users', () => {
    it('should create a user successfully with valid data', async () => {
      const mockUser = {
        id: '123',
        usuario: 'testuser',
        correo: 'test@example.com',
        createdAt: new Date().toISOString()
      };

      (userController.createUserHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json(mockUser);
      });

      const response = await request(app)
        .post('/api/users')
        .send({
          usuario: 'testuser',
          correo: 'test@example.com',
          datos_adicionales: {}
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockUser);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      // Validation middleware should reject this
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          usuario: 'testuser',
          correo: 'invalid-email'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/users', () => {
    it('should list users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          usuario: 'user1',
          correo: 'user1@example.com',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          usuario: 'user2',
          correo: 'user2@example.com',
          createdAt: new Date().toISOString()
        }
      ];

      (userController.listUsersHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array when no users exist', async () => {
      (userController.listUsersHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle server errors gracefully', async () => {
      (userController.listUsersHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Content-Type validation', () => {
    it('should accept application/json content type', async () => {
      const mockUser = {
        id: '123',
        usuario: 'testuser',
        correo: 'test@example.com'
      };

      (userController.createUserHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json(mockUser);
      });

      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send({
          usuario: 'testuser',
          correo: 'test@example.com'
        });

      expect(response.status).toBeLessThan(500);
    });

    it('should return JSON content type', async () => {
      const mockUsers: any[] = [];

      (userController.listUsersHandler as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/api/users');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

