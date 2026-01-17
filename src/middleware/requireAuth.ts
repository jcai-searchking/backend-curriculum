import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../errors/AppErrors'

export function requiredAuth(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader) throw new AppError('Unauthorized', 401)

    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) throw new AppError('Unauthorized', 401)

    let payload: any

    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
        throw new AppError('Unauthorized', 401)
    }

    req.user = {
        id: payload.sub,
    }
    return next()
}
