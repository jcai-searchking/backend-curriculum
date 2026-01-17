import { app } from '../../src/app'
import { prisma } from '../../src/prisma'
import request from 'supertest'
import { resetDb, disconnectDb } from '../helpers/db'
import { seedUser } from '../helpers/users'
import { makeAuthHeader } from '../helpers/auth'

let authHeader: string

beforeEach(async () => {
    await resetDb()
    authHeader = makeAuthHeader('test-user')
})
afterAll(disconnectDb)

describe('DELETE /users/:id', () => {
    it('Soft deletes a user', async () => {
        let user = await seedUser()

        const res = await request(app)
            .delete(`/users/${user.id}`)
            .set('Authorization', authHeader)

        expect(res.status).toBe(200)

        const inDb = await prisma.user.findUnique({
            where: { id: user.id }
        })

        expect(inDb?.deletedAt).not.toBeNull()
    })

    it('Returns 404 if user does not exist', async () => {
        const res = await request(app)
            .delete('/users/c123456789')
            .set('Authorization', authHeader)

        expect(res.status).toBe(404)
    })

    it('Returns 404 if user is already soft-deleted', async () => {
        const deletedUser = await seedUser({ deletedAt: new Date()})

        const res = await request(app)
            .delete(`/users/${deletedUser.id}`)
            .set('Authorization', authHeader)

        expect(res.status).toBe(404)
    })

    it('Returns 400 for invalid ID', async () => {
        const res = await request(app)
            .delete('/users/alice')
            .set('Authorization', authHeader)

        expect(res.status).toBe(400)
    })
})
