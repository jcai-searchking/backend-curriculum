import { app } from '../../src/app'
import { prisma } from '../../src/prisma'
import request from 'supertest'
import { resetDb, disconnectDb } from '../helpers/db'
import { seedUser } from '../helpers/users'

beforeEach(resetDb)
afterAll(disconnectDb)

describe('DELETE /users/:id', () => {
    it('Soft deletes a user', async () => {
        let user = await seedUser()

        const res = await request(app).delete(`/users/${user.id}`)

        expect(res.status).toBe(200)

        const inDb = await prisma.user.findUnique({
            where: { id: user.id }
        })

        expect(inDb?.deletedAt).not.toBeNull()
    })

    it('Returns 404 if user does not exist', async () => {
        const res = await request(app).delete('/users/99999')

        expect(res.status).toBe(404)
    })

    it('Returns 404 if user is already soft-deleted', async () => {
        const deletedUser = await seedUser({ deletedAt: new Date()})

        const res = await request(app).delete(`/users/${deletedUser.id}`)

        expect(res.status).toBe(404)
    })

    it('Returns 400 for invalid ID', async () => {
        const res = await request(app).delete('/users/alice')

        expect(res.status).toBe(400)
    })
})