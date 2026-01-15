import e, { Request, Response } from 'express'
import argon2 from 'argon2'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { registerSchema, loginSchema } from './auth.schemas'
import { AppError } from '../errors/AppErrors'

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
        throw new AppError('Invalid Input', 400, parsed.error.flatten())
    }

    const { email, password, name, age } = parsed.data

    const passwordHash = await argon2.hash(password)

    try {
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                age
            },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                createdAt: true,
            }
        })

        return res.status(201).json({ user })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new AppError('Email already in use', 409)
        }
        throw err
    }
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
        throw new AppError('Invalid input', 400, parsed.error.flatten())
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findFirst({
        where: {
            email,
            deletedAt: null,
        }
    })

    if (!user) throw new AppError("Invalid credentials", 401)
    const isValid = await argon2.verify(
        user.passwordHash,
        password
    )
    if(!isValid) throw new AppError("Invalid credentials", 401)

    return res.status(200).json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    })
}
