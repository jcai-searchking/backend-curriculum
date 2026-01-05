import { z } from 'zod'

declare global {
    namespace Express {
        interface Request {
            validatedBody? : unknown;
            validatedQuery? : unknown;
            validatedParams? : unknown;           
        }
    }
}