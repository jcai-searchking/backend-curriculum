import { z } from 'zod'
import 'express'

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
            }
            validatedBody?: unknown
            validatedQuery?: unknown
            validatedParams?: unknown
        }
    }
}
