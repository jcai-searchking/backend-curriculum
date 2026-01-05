import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppErrors";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (err instanceof AppError) {
       return res.status(err.statusCode).json({
            error: {
                message: err.message,
                statusCode: err.statusCode
            }
        })
    }
    console.error(err)

    return res.status(500).json({
        error: "Internal server error",
        statusCode: 500,
    });
}