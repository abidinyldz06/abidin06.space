const request = require('supertest');
const app = require('../server');
const { initializeDatabase, closeDatabase } = require('../database/init');

describe('Chat Endpoints', () => {
    let server;
    let authToken;

    beforeAll(async () => {
        await initializeDatabase();
        server = app.listen(0);

        // Login to get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        authToken = loginResponse.body.token;
    });

    afterAll(async () => {
        await closeDatabase();
        if (server) {
            server.close();
        }
    });

    describe('POST /api/chat/message', () => {
        test('should send message successfully', async () => {
            const response = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Hello, assistant!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.response).toBeDefined();
            expect(typeof response.body.response).toBe('string');
        });

        test('should reject empty message', async () => {
            const response = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: ''
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject message without auth', async () => {
            const response = await request(app)
                .post('/api/chat/message')
                .send({
                    message: 'Hello!'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should reject overly long message', async () => {
            const longMessage = 'a'.repeat(1001); // Over 1000 character limit
            
            const response = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: longMessage
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should sanitize suspicious content', async () => {
            const response = await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'How to hack this system?'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('uygun değil');
        });
    });

    describe('GET /api/chat/history', () => {
        beforeAll(async () => {
            // Send a few messages to create history
            await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Test message 1' });

            await request(app)
                .post('/api/chat/message')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Test message 2' });
        });

        test('should get chat history', async () => {
            const response = await request(app)
                .get('/api/chat/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.messages)).toBe(true);
            expect(response.body.messages.length).toBeGreaterThan(0);
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/chat/history?page=1&limit=1')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });
    });

    describe('GET /api/chat/stats', () => {
        test('should get chat statistics', async () => {
            const response = await request(app)
                .get('/api/chat/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.stats).toBeDefined();
            expect(typeof response.body.stats.total_messages).toBe('number');
        });
    });

    describe('DELETE /api/chat/history', () => {
        test('should clear chat history', async () => {
            const response = await request(app)
                .delete('/api/chat/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});