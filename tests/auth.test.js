const request = require('supertest');
const app = require('../server');
const { initializeDatabase, closeDatabase } = require('../database/init');

describe('Authentication Endpoints', () => {
    let server;

    beforeAll(async () => {
        await initializeDatabase();
        server = app.listen(0); // Use random port for testing
    });

    afterAll(async () => {
        await closeDatabase();
        if (server) {
            server.close();
        }
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.username).toBe('admin');
        });

        test('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('hatalı');
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin'
                    // missing password
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should enforce rate limiting', async () => {
            const promises = [];
            
            // Make 6 requests (rate limit is 5)
            for (let i = 0; i < 6; i++) {
                promises.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({
                            username: 'admin',
                            password: 'wrongpassword'
                        })
                );
            }

            const responses = await Promise.all(promises);
            const rateLimitedResponse = responses.find(r => r.status === 429);
            
            expect(rateLimitedResponse).toBeDefined();
            expect(rateLimitedResponse.body.code).toBe('RATE_LIMIT_EXCEEDED');
        });
    });

    describe('GET /api/auth/validate', () => {
        let authToken;

        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                });
            
            authToken = loginResponse.body.token;
        });

        test('should validate valid token', async () => {
            const response = await request(app)
                .get('/api/auth/validate')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toBeDefined();
        });

        test('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/validate')
                .set('Authorization', 'Bearer invalidtoken');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test('should reject missing token', async () => {
            const response = await request(app)
                .get('/api/auth/validate');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let authToken;

        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                });
            
            authToken = loginResponse.body.token;
        });

        test('should get user profile', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.username).toBe('admin');
            expect(response.body.user.password).toBeUndefined(); // Password should not be returned
        });
    });
});