import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppErrors";
import { logError } from "../utils/logger";
import { ENV } from "../config/env";

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
                statusCode: err.statusCode,
            },
        });
    }
    logError(err);

    const message =
        ENV.NODE_ENV === "production"
            ? "Internal server error"
            : err instanceof Error
                ? err.message
                : String(err);

    return res.status(500).json({
        error: {
            message,
            statusCode: 500,
        },
    });
}
