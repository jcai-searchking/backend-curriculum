import request from 'supertest'
import { app } from '../../src/app'
import { resetDb, disconnectDb } from '../helpers/db'
import { prisma } from '../../src/prisma'
import { makeAuthHeader } from '../helpers/auth'

let authHeader: string

beforeEach(async () => {
    await resetDb()
    authHeader = makeAuthHeader('test-user')
})
afterAll(disconnectDb)

describe('POST /users', ()=> {
    it("successfully created user", async () => {
        const res = await request(app)
            .post('/users')
            .set('Authorization', authHeader)
            .send({
                email: 'elise@example.com',
                password: 'password123',
                name: 'Elise',
                age: 25,
            })
        
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('user')
        expect(res.body.user.email).toBe('elise@example.com')
        expect(res.body.user.name).toBe('Elise')
        expect(res.body.user.age).toBe(25)
        expect(res.body.user).not.toHaveProperty('passwordHash')

        const inDb = await prisma.user.findFirst({ where: {
            email: "elise@example.com" },
        })
        expect(inDb).not.toBeNull()
    })

    it("returns 400 if body is invalid", async ()=> {
        const res = await request(app)
            .post('/users')
            .set('Authorization', authHeader)
            .send({ name: 'Elise', age: 25, password: 'password123' })

        expect(res.status).toBe(400)
    })

    it("returns 400 if age is not a number", async () => {
        const res = await request(app)
            .post('/users')
            .set('Authorization', authHeader)
            .send({
                email: 'elise@example.com',
                password: 'password123',
                name: 'elise',
                age: '25',
            })

        expect(res.status).toBe(400)
    })
        


} )
