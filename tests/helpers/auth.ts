import jwt from 'jsonwebtoken'

export function makeAuthHeader(userId: string) {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not set')
    }

    const token = jwt.sign({ sub: userId }, secret, { expiresIn: '15m' })
    return `Bearer ${token}`
}
