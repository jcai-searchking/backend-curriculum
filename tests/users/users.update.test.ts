import request from 'supertest'
import { app } from '../../src/app'
import { resetDb, disconnectDb } from '../helpers/db'
import { prisma } from '../../src/prisma'
import { seedUser } from '../helpers/users'

beforeEach(resetDb)
afterAll(disconnectDb)

describe('PUT /users/:id', () => {
    it('Updates a user by ID param', async () => {
        const user = await seedUser()
        
        const res = await request(app)
        .put(`/users/${user.id}`)
        .send({ name: 'Alison', age: 25 })
        
        expect(res.status).toBe(200)
        expect(res.body.user.name).toBe("Alison")
        expect(res.body.user.age).toBe(25)
    })

    it('Returns 400 for empty body', async () => {
        const user = await seedUser()

        const res = await request(app)
            .put(`/users/${user.id}`)
            .send({})
        
        expect(res.status).toBe(400)
    })

    it('Returns 404 if user does not exist', async ()=> {
        const res = await request(app)
            .put(`/users/c123456789`)
            .send({ name: 'NonExistentUser' })

        expect(res.status).toBe(404)

    })

    it('Does not update a soft-deleted user', async() => {
        const deletedUser = await seedUser({ name:'Deleted', deletedAt: new Date() })

        const res = await request(app)
            .put(`/users/${deletedUser.id}`)
            .send({ name: 'ShouldNotUpdate'})
            
            expect(res.status).toBe(404)
            
            const inDb = await prisma.user.findUnique({
                where: { id: deletedUser.id}
            })
            
            expect(inDb?.name).toBe('Deleted')
    })

})
