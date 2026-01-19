import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getMe(req: Request, res: Response) {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            age: true,
        },
    });
    return res.json({ user });
}
