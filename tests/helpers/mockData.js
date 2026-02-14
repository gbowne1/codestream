/**
 * Mock data for testing
 */

export const mockUsers = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  },
  adminUser: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  existingUser: {
    username: 'existing',
    email: 'existing@example.com',
    password: 'existing123',
  },
};

export const mockStreams = [
  {
    id: 1,
    title: 'Test Stream 1',
    user: 'teststreamer',
    viewers: 1500,
    category: 'webdev',
    subCategory: 'frontend',
    programmingLanguages: ['javascript', 'react'],
    tags: ['javascript', 'react'],
    img: '/test-img.jpg',
  },
  {
    id: 2,
    title: 'Test Stream 2',
    user: 'anotherstreamer',
    viewers: 3200,
    category: 'gamedev',
    subCategory: 'unity',
    programmingLanguages: ['csharp'],
    tags: ['unity', 'csharp', 'tutorial'],
    img: '/test-img2.jpg',
  },
  {
    id: 3,
    title: 'Test Stream 3',
    user: 'codingmaster',
    viewers: 500,
    category: 'webdev',
    subCategory: 'backend',
    programmingLanguages: ['python', 'django'],
    tags: ['python', 'django', 'api'],
    img: '/test-img3.jpg',
  },
];

export const mockJWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.test';
