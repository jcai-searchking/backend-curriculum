import { prisma } from "../../src/prisma";
import { closeQueues } from "./queue";

export async function resetDb(){
    await prisma.user.deleteMany()
}

export async function disconnectDb(){
    await prisma.$disconnect()
    await closeQueues()
}

