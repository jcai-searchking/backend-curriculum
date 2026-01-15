import { z } from 'zod'
export const registerSchema = z.object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(8),
    name: z.string().trim().min(1),
    age: z.number().int().positive(),
})
export const loginSchema = z.object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
