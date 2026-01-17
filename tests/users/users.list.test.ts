import request from "supertest"
import { app } from "../../src/app"
import { seedUser } from "../helpers/users"
import { disconnectDb, resetDb } from "../helpers/db"
import { makeAuthHeader } from "../helpers/auth"

let authHeader: string

beforeEach(async () => {
    await resetDb()
    authHeader = makeAuthHeader('test-user')
})
afterAll(disconnectDb)

describe('GET /users', ()=> {
    it('List all users', async () => {
        await seedUser()
        await seedUser({ name: "Marissa"})
        await seedUser({ name: "Cassandra", age: 23 })

        const res = await request(app)
            .get('/users')
            .set('Authorization', authHeader)

        expect(res.status).toBe(200)
        expect(res.body.users.length).toBe(3)

    })
    it("Filters active=true", async () => {
        await seedUser({ name: "Active", deletedAt: null})
        await seedUser({ name: "Deleted", deletedAt: new Date()})

        const res = await request(app)
            .get('/users')
            .set('Authorization', authHeader)
            .query({ active: 'true' })

        expect(res.status).toBe(200)
        expect(res.body.users.length).toBe(1)
        expect(res.body.users[0].name).toBe("Active")

    })

    it('Filters active=false', async () => {
        await seedUser({ name: 'Active', deletedAt: null })
        await seedUser({ name: 'Deleted', deletedAt: new Date() })

        const res = await request(app)
            .get('/users')
            .set('Authorization', authHeader)
            .query({ active: 'false' })
        
        expect(res.status).toBe(200)
        expect(res.body.users.length).toBe(1)
        expect(res.body.users[0].name).toBe("Deleted")
    })

    it('Filter by minAge', async () => {
        await seedUser({ name: 'Young', age: 20 })
        await seedUser({ name: "Chloe", age: 27 })
        await seedUser()
        await seedUser({ name: 'Old', age: 65 })

        const res = await request(app)
            .get('/users')
            .set('Authorization', authHeader)
            .query({ minAge: '25' })

        expect(res.status).toBe(200)
        expect(res.body.users.length).toBe(3)
        expect(res.body.users[0].name).toBe("Chloe")
    })

    it('Returns 400 for invalid query', async () => {
        const res = await request(app)
            .get('/users')
            .set('Authorization', authHeader)
            .query({ minAge: 'legal' })

        expect(res.status).toBe(400)
    })
})
