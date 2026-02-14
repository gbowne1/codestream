import { vi } from 'vitest';

/**
 * Mock Express request object
 * @param {Object} options - Options for creating mock request
 * @returns {Object} Mock request object
 */
export function mockRequest(options = {}) {
  const headers = options.headers || {};

  return {
    body: options.body || {},
    header: vi.fn((name) => headers[name]),
    headers: headers,
    user: options.user || null,
    params: options.params || {},
    query: options.query || {},
    ...options,
  };
}

/**
 * Mock Express response object
 * @returns {Object} Mock response object with chainable methods
 */
export function mockResponse() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Mock Express next function
 * @returns {Function} Mock next function
 */
export function mockNext() {
  return vi.fn();
}
