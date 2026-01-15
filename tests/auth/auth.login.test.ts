import request from 'supertest'
import { app } from '../../src/app'
import { resetDb, disconnectDb } from '../helpers/db'
import { seedUser } from '../helpers/users'
import argon2 from 'argon2'
import type { User } from '@prisma/client'


let megan: User
let sam: User
beforeEach(async ()=> {
    await resetDb()
    const passwordHash = await argon2.hash('password123')
    megan = await seedUser({
        name: 'Megan',
        email: 'testuser@sk.ca',
        passwordHash,
    })
    sam = await seedUser({
        name: 'Samantha',
        email: 'inactiveuser@sk.ca',
        passwordHash,
        deletedAt: new Date()
    })
})
afterAll(disconnectDb)


describe('POST /auth/login', () => {
    it('Login with correct credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@sk.ca',
                password: 'password123',
            })
        expect(res.status).toBe(200)

        expect(res.body.user).not.toHaveProperty('password')
        expect(res.body.user).not.toHaveProperty('passwordHash')
        expect(res.body.user).toMatchObject({
            id: megan.id,
            name: megan.name,
            email: megan.email
        })
    })
    it('Wrong password', async() => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@sk.ca',
                password: 'wrongpassword',
            })
        expect(res.status).toBe(401)
        expect(res.body.error.message).toBe('Invalid credentials')
    })

    it('non existing user', async() => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'doesNotExistUser@sk.ca',
                password: 'password123',
            })
        expect(res.status).toBe(401)
        expect(res.body.error.message).toBe('Invalid credentials')
    })

    it('existing user but inactive', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'inactiveuser@sk.ca',
                password: 'password123',
            })
       expect(res.status).toBe(401)
    })

})
