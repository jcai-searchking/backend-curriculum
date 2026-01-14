import { prisma } from '../../src/prisma'

let userCounter = 0

export async function seedUser( data?: {
    name?:string,
    age?:number,
    deletedAt?: Date | null,
    email?: string,
    passwordHash?: string,
}) {

    return prisma.user.create({
        data: {
            name: data?.name ?? 'Alice',
            age: data?.age ?? 30, 
            deletedAt: data?.deletedAt ?? null,
            email: data?.email ?? `user${++userCounter}@example.com`,
            passwordHash: data?.passwordHash ?? 'test-hash',
        }
    })
}
