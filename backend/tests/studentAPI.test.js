import request from 'supertest';
import app from '../server.js'; // adjust the import if server is exported differently

describe('Backend API sanity tests', () => {
  // Test 1: Basic health route
  test('GET / should return 200 and "API Working"', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/API Working/i);
  });

  // Test 2: /api/students/sections returns an array
  test('GET /api/students/sections should return JSON with success=true', async () => {
    const res = await request(app).get('/api/students/sections');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.sections)).toBe(true);
  });
});
