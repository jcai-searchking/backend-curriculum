import request from "supertest"
import { app } from "../../src/app"
import { prisma } from "../../src/prisma"
import { seedUser } from "../helpers/users"
import { disconnectDb, resetDb } from "../helpers/db"
import { makeAuthHeader } from "../helpers/auth"

let authHeader: string

beforeEach(async () => {
    await resetDb()
    authHeader = makeAuthHeader('test-user')
})
afterAll(disconnectDb)

describe('GET /users/:id', ()=> {
    it("Get user by ID param", async () => {
        await seedUser()
        const megan = await seedUser({ name: "Megan", age: 26})
        await seedUser({ name: "Sam", age: 23})

        const res = await request(app)
            .get(`/users/${megan.id}`)
            .set('Authorization', authHeader)

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('user')
        expect(res.body.user.name).toBe('Megan')
        expect(res.body.user.age).toBe(26)
    })

    it("User not found", async () => {

        const res = await request(app)
            .get('/users/c123456789')
            .set('Authorization', authHeader)

        expect(res.status).toBe(404)
    })

    it('Returns 404 if user is soft-deleted', async () => {
    const user = await seedUser({ deletedAt: new Date() })

    const res = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', authHeader)
    expect(res.status).toBe(404)
  })

    it("Invalid request param", async () => {
        const res = await request(app)
            .get('/users/abc')
            .set('Authorization', authHeader)

        expect(res.status).toBe(400)
    })
})
