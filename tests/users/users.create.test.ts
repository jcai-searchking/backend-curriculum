import request from 'supertest'
import { app } from '../../src/app'
import { resetDb, disconnectDb } from '../helpers/db'
import { prisma } from '../../src/prisma'

beforeEach(resetDb)
afterAll(disconnectDb)

describe('POST /users', ()=> {
    it("successfully created user", async () => {
        const res = await request(app)
        .post('/users')
        .send({ name: 'Elise', age: 25 })
        
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('user')
        expect(res.body.user.name).toBe('Elise')
        expect(res.body.user.age).toBe(25)

        const inDb = await prisma.user.findFirst({ where: {
            name: "Elise" },
        })
        expect(inDb).not.toBeNull()
    })

    it("returns 400 if body is invalid", async ()=> {
        const res = await request(app)
        .post('/users')
        .send({ name: "Elise"})

        expect(res.status).toBe(400)
    })

    it("returns 400 if age is not a number", async () => {
        const res = await request(app)
        .post('/users')
        .send({ name: 'elise', age: '25'})

        expect(res.status).toBe(400)
    })
        


} )