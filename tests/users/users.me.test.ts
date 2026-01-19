import request from 'supertest';
import { app } from '../../src/app';
import { resetDb, disconnectDb } from '../helpers/db';
import { seedUser } from '../helpers/users';
import { makeAuthHeader } from '../helpers/auth';

beforeEach(resetDb);
afterAll(disconnectDb);

describe('GET /users/me', () => {
    it('Returns 401 without token', async () => {
        const res = await request(app).get('/users/me');
        expect(res.status).toBe(401);
    });

    it('Returns 401 with invalid token', async () => {
        const res = await request(app)
            .get('/users/me')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(401);
    });

    it('Returns current user with valid token', async () => {
        const user = await seedUser();

        const res = await request(app)
            .get('/users/me')
            .set('Authorization', makeAuthHeader(user.id));

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
        });
    });
});
