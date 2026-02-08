import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  mockRequest,
  mockResponse,
  mockNext,
} from '../../../helpers/mockExpress.js';
import { auth, authorizeRole } from '../../../../src/middleware/auth.js';

describe('Auth Middleware', () => {
  let req, res, next;
  const TEST_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  describe('auth()', () => {
    it('should pass with valid token', () => {
      const token = jwt.sign({ id: '123', role: 'user' }, TEST_SECRET);
      req = mockRequest({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      res = mockResponse();
      next = mockNext();

      auth(req, res, next);

      // Check if error path was taken
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      // Check success path
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('123');
      expect(req.user.role).toBe('user');
    });

    it('should return 401 with no authorization header', () => {
      req.header = vi.fn(() => null);

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No token, authorization denied.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token format', () => {
      req.header = vi.fn(() => 'InvalidFormat');

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token format invalid. Use Bearer scheme.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', () => {
      req.header = vi.fn(() => 'Bearer invalid-token');

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid or has expired.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with expired token', () => {
      const expiredToken = jwt.sign(
        { id: '123', role: 'user' },
        TEST_SECRET,
        { expiresIn: '-1s' } // Already expired
      );
      req.header = vi.fn(() => `Bearer ${expiredToken}`);

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token is not valid or has expired.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole()', () => {
    it('should allow user with correct role', () => {
      req.user = { id: '123', role: 'admin' };
      const middleware = authorizeRole(['admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny user with incorrect role', () => {
      req.user = { id: '123', role: 'user' };
      const middleware = authorizeRole(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow user with one of multiple allowed roles', () => {
      req.user = { id: '123', role: 'admin' };
      const middleware = authorizeRole(['admin', 'moderator']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 500 if user role is missing', () => {
      req.user = { id: '123' }; // No role
      const middleware = authorizeRole(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authorization setup error: User role not found.',
      });
    });

    it('should return 500 if user object is missing', () => {
      req.user = null;
      const middleware = authorizeRole(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
