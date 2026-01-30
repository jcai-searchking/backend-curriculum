import { Request, Response } from 'express';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { registerSchema, loginSchema } from './auth.schemas';
import { AppError } from '../errors/AppErrors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { hashToken } from '../utils/crypto';
import cookieParser from 'cookie-parser';

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new AppError('Invalid Input', 400, parsed.error.flatten());
    }

    const { email, password, name, age } = parsed.data;

    const passwordHash = await argon2.hash(password);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                age,
            },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                createdAt: true,
            },
        });

        return res.status(201).json({ user });
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
        ) {
            throw new AppError('Email already in use', 409);
        }
        throw err;
    }
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new AppError('Invalid input', 400, parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user || user.deletedAt) throw new AppError('Invalid credentials', 401);
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) throw new AppError('Invalid credentials', 401);

    //Create refresh Token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
    });

    const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '15m',
    });

    return res.status(200).json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            accessToken,
        },
    });
}

export async function refresh(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError('Missing refresh token', 401);
    }

    const tokenHash = hashToken(refreshToken);

    const existingToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
    });

    if (!existingToken || existingToken.revokedAt) {
        throw new AppError('Invalid or revoked token', 401);
    }

    await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: new Date() },
    });

    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash: newRefreshTokenHash,
            userId: existingToken.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    const newAccessToken = jwt.sign(
        { sub: existingToken.user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' },
    );
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        path: '/',
    });

    return res.status(200).json({ accessToken: newAccessToken });
}
