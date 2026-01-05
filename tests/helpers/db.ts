import { prisma } from "../../src/prisma";

export async function resetDb(){
    await prisma.user.deleteMany()
}

export async function disconnectDb(){
    await prisma.$disconnect()
}

