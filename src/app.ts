import express from 'express';
import { z } from 'zod';

import { validateBody, validateParams, validateQuery } from './middleware/validate';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './errors/AppErrors';

import 'dotenv/config';
import { prisma } from "./prisma"



export const app = express()
app.use(express.json())

// Types  ============================================

interface User {
    id: number;
    name: string;
    age: number;
    deletedAt: Date | null
}

// Zod Schemas =======================================

const createUserSchema = z.object({
    name: z.string(),
    age: z.number()
})

const updateUserSchema = z.object({
    name: z.string().optional(),
    age: z.number().optional(),
  })
  .refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
);

const userParamSchema = z.object({
    id: z
    .string()
    .regex(/^\d+$/, 'id must be a number')
})

const userQuerySchema = z.object({
    active: z.preprocess( val => {
        if (val === undefined ) return undefined
        return val === 'true'
    },
    z.boolean().optional()
    ),

    minAge: z
    .coerce.number()
    .optional()

})


// Routes ==========================================

// Create User
app.post(
    '/users',
    validateBody(createUserSchema),
    async (req, res)  =>   {

    const { name, age } = req.validatedBody as {
        name: string,
        age: number
    }

    const user = await prisma.user.create({
        data: {
            name,
            age,
        }
    })
   
    res.status(201).json({
        message: 'User Successfully Created',
        user,
    })
})

// List Users
app.get('/users/',
    validateQuery(userQuerySchema),
    async (req, res) => {
        const { active, minAge } = req.validatedQuery as {
            active? : boolean;
            minAge? : number;
        }

        const where: any = {}

        if (active === true) {
            where.deletedAt = null
        }

        if (active === false) {
            where.deletedAt = {not: null }
        }

        if (minAge !== undefined) {
            where.age = {gte: minAge}
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { id: 'asc'},
        });

        res.status(200).json({users})
    }
)

// Get User
app.get('/users/:id',
    validateParams(userParamSchema),
    async(req, res) => {
        const {id} = req.validatedParams as { id: string}
        
        const numericId = Number(id)

        const user = await prisma.user.findFirst({
            where: {
                id: numericId,
                deletedAt: null
            }
        })
        
        if (!user) {
            throw new AppError("User not found", 404)
        }
        
        res.status(200).json({user})
})


// Update User
app.put(
    '/users/:id', 
    validateParams(userParamSchema), 
    validateBody(updateUserSchema),
    async (req, res) => {
    const { id }  = req.validatedParams as { id:string }
    const numericID = Number(id) 

    const { name, age } = req.validatedBody as {
        name?: string,
        age?: number
    }
    
    const existingUser = await prisma.user.findFirst({
        where: { 
            id: numericID, 
            deletedAt: null,
        },
    })

    if (!existingUser) {
        throw new AppError('User not found', 404)
    }

    const updatedUser = await prisma.user.update({
        where: { id: numericID},
        data: {
            ...(name !== undefined && {name}),
            ...(age !== undefined && {age})
        }
    })

    res.status(200).json({
        message: "Updated User Successfully",
        user: updatedUser,
    })
})



// delete user
app.delete('/users/:id',
    validateParams(userParamSchema),
    async (req, res) => {
    const { id } = req.validatedParams as { id:string }
    const numericId = Number(id)
    

    try {
        
        const user = await prisma.user.update({
            where: { 
                id: numericId,
                deletedAt: null,
             },
            data: {
                deletedAt: new Date()
            }
        });

        res.status(200).json({ message: "User deleted successfully"});
        
    } catch (error) {
        throw new AppError('User does not exist', 404)
    }
});

app.use(errorHandler);
