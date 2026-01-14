import request from 'supertest'
import { app } from '../../src/app'
import { prisma } from '../../src/prisma'
import { resetDb, disconnectDb } from '../helpers/db'

beforeEach(resetDb)
afterAll(disconnectDb)

describe('POST /auth/login', () => {
    it('User logins with correct password', async () => {
        const res = await request(app)
            .post('/auth/log')
            .send({
                email: 'testuser@sk.ca',
                password: 'password123',
            })
        expect(res.status).toBe(200)

        expect(res.body).not.toHaveProperty('password')
        expect(res.body).not.toHaveProperty('passwordHash')
        
        const user = await prisma.user.findUnique({
            where: { email: 'testuser@sk.ca' },
        })
        
        expect(user).toBeTruthy()
        expect(user!.passwordHash).not.toBe('password123')
    })

})
