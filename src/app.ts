import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import redis from './redis';

import express from 'express';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import argon2 from 'argon2';

import {
    validateBody,
    validateParams,
    validateQuery,
} from './middleware/validate';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './errors/AppErrors';
import authRoutes from './auth/auth.routes';
import healthRoutes from './health/health.routes';
import usersRoutes from './users/users.routes';
import { requiredAuth } from './middleware/requireAuth';

import 'dotenv/config';
import { prisma } from './prisma';

export const app = express();
app.use(express.json());
app.use(cookieParser());

// Types  ============================================

interface User {
    id: string;
    name: string;
    age: number;
    deletedAt: Date | null;
}

// Zod Schemas =======================================

const createUserSchema = z.object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(8),
    name: z.string(),
    age: z.number().int().positive(),
});

const updateUserSchema = z
    .object({
        name: z.string().optional(),
        age: z.number().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided',
    });

const userParamSchema = z.object({
    id: z.string().trim().pipe(z.cuid()),
});

const userQuerySchema = z.object({
    active: z.preprocess((val) => {
        if (val === undefined) return undefined;
        return val === 'true';
    }, z.boolean().optional()),

    minAge: z.coerce.number().optional(),
});

// Documentation Route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Authentication Route
app.use('/health', healthRoutes);

app.use('/auth', authRoutes);

// Protect all /users routes
app.use('/users', requiredAuth);
app.use('/users', usersRoutes);

// Routes ==========================================

// Create User
app.post('/users', validateBody(createUserSchema), async (req, res) => {
    const { email, password, name, age } = req.validatedBody as {
        email: string;
        password: string;
        name: string;
        age: number;
    };

    const passwordHash = await argon2.hash(password);

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
            deletedAt: true,
            createdAt: true,
        },
    });

    res.status(201).json({
        message: 'User Successfully Created',
        user,
    });
});

// List Users
app.get('/users/', validateQuery(userQuerySchema), async (req, res) => {
    const cacheKey = `users:${JSON.stringify(req.validatedQuery)}`;

    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        console.log('⚡️ Serving from Cache (Fast)');
        return res.status(200).json(JSON.parse(cachedData));
    }

    const { active, minAge } = req.validatedQuery as {
        active?: boolean;
        minAge?: number;
    };

    const where: any = {};

    if (active === true) {
        where.deletedAt = null;
    }

    if (active === false) {
        where.deletedAt = { not: null };
    }

    if (minAge !== undefined) {
        where.age = { gte: minAge };
    }

    console.log('🐢 Serving from Database (Slow)');
    const users = await prisma.user.findMany({
        where,
        orderBy: { id: 'asc' },
        select: {
            id: true,
            email: true,
            name: true,
            age: true,
            deletedAt: true,
            createdAt: true,
        },
    });

    if (users.length > 0) {
        await redis.set(cacheKey, JSON.stringify({ users }), 'EX', 60);
    }

    res.status(200).json({ users });
});

// Get User
app.get('/users/:id', validateParams(userParamSchema), async (req, res) => {
    const { id } = req.validatedParams as { id: string };

    const user = await prisma.user.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        select: {
            id: true,
            email: true,
            name: true,
            age: true,
            deletedAt: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({ user });
});

// Update User
app.put(
    '/users/:id',
    validateParams(userParamSchema),
    validateBody(updateUserSchema),
    async (req, res) => {
        const { id } = req.validatedParams as { id: string };

        const { name, age } = req.validatedBody as {
            name?: string;
            age?: number;
        };

        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(age !== undefined && { age }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                deletedAt: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            message: 'Updated User Successfully',
            user: updatedUser,
        });
    },
);

// delete user
app.delete('/users/:id', validateParams(userParamSchema), async (req, res) => {
    const { id } = req.validatedParams as { id: string };

    try {
        const user = await prisma.user.update({
            where: {
                id,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        throw new AppError('User does not exist', 404);
    }
});

app.use(errorHandler);
