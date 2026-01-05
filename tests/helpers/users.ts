import {prisma } from '../../src/prisma'

export async function seedUser( data?: {
    name?:string,
    age?:number,
    deletedAt?: Date | null
}) {

    return prisma.user.create({
        data: {
            name: data?.name ?? 'Alice',
            age: data?.age ?? 30, 
            deletedAt: data?.deletedAt ?? null,
        }
    })
}