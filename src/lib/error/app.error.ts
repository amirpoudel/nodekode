import { createLogger } from "./logs.error";

const mongoLogger = createLogger("MongoError");
const zodLogger = createLogger("ZodError");
const appLogger = createLogger("AppError");

export class AppError extends Error {
    public readonly message: string;
    public readonly statusCode: number;
    public readonly status: string;
    public readonly error: any | null;
    public readonly errors: any[];
    public readonly isOperational: boolean;
    public readonly isError: boolean = true;

    constructor(
        statusCode: number,
        message: string,
        error: any,
        errors: any[],
        status: string,
        isOperational: boolean
    ) {
        super(message);
        this.message = message;
        this.error = error;
        this.errors = errors;
        this.statusCode = statusCode;
        this.status = status;
        this.isOperational = isOperational;
        this.isError = true;
        Error.captureStackTrace(this, this.constructor);
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    public static zodError(
        message: string,
        error: any,
        errors: any[] = [],
        isOperational: boolean = true
    ) {
        zodLogger.error(`${message} - ${error} - ${errors}`);
        return new AppError(400, message, "Validation Error", error.issues ?? errors, "fail", isOperational);
    }

    public static badRequest(
        message: string,
        error: any = null,
        errors: any[] = [],
        isOperational: boolean = true
    ) {
        appLogger.info(`${message} - ${error} - ${errors}`);
        return new AppError(400, message, error, errors, "fail", isOperational);
    }

    // ─── Auth ─────────────────────────────────────────────────────────────────

    public static invalidCredentials(message: string) {
        return new AppError(401, message, "", [], "fail", true);
    }

    public static unauthorized(message: string, error: any = "") {
        return new AppError(401, message, error, [], "fail", true);
    }

    public static forbidden(message: string, error: any = "") {
        return new AppError(403, message, error, [], "fail", true);
    }

    // ─── Resource ─────────────────────────────────────────────────────────────

    public static notFound(message: string) {
        return new AppError(404, message, "", [], "fail", true);
    }

    public static conflict(
        message: string,
        error: any = null,
        errors: any[] = [],
        isOperational: boolean = true
    ) {
        appLogger.info(`${message} - ${error} - ${errors}`);
        return new AppError(409, message, error, errors, "fail", isOperational);
    }

    // ─── Server ───────────────────────────────────────────────────────────────

    public static internalServerError(message: string, error: any = null) {
        mongoLogger.error(`${message}`);
        return new AppError(500, message, error, [], "error", true);
    }

    // ─── Database ─────────────────────────────────────────────────────────────

    public static mongoError(
        message: string,
        error: any,
        errors: any[] = [],
        isOperational: boolean = true
    ) {
        let statusCode = 400;
        let newError: any = "";

        if (error.code === 11000) {
            const key = Object.keys(error.keyValue)[0];
            const value = Object.values(error.keyValue)[0];
            newError = `Duplicate key error: Key '${key}' with value '${value}' already exists.`;
            message = `${key} already exists.`;
            statusCode = 409;
        }

        if (newError === "") newError = error;

        mongoLogger.error(`${message} - ${JSON.stringify(newError)}`);
        return new AppError(statusCode, message, newError, [], "fail", isOperational);
    }

    public static prismaError(
        message: string,
        error: any,
        errors: any[] = [],
        isOperational: boolean = true
    ) {
        let errorMessage = message;
        let errorStatus = "fail";

        switch (error.code) {
            case "P1013":
                errorMessage = `Database connection error: ${error.message}`;
                break;
            case "P2000":
                errorMessage = `Value too long for column '${error.meta?.column_name}'`;
                break;
            case "P2002":
                errorMessage = `Unique constraint failed on '${error.meta?.constraint}'`;
                break;
            case "P2003":
                errorMessage = `Foreign key constraint failed on field '${error.meta?.field_name}'`;
                break;
            case "P2025":
                errorMessage = `Dependent record not found: ${error.meta?.cause}`;
                break;
            case "P3018":
                errorMessage = `Migration error on '${error.meta?.migration_name}': ${error.message}`;
                break;
            case "P6002":
                errorMessage = `Unauthorized API key for Prisma Accelerate`;
                errorStatus = "unauthorized";
                break;
            case "P6004":
                errorMessage = `Prisma Accelerate query timeout exceeded.`;
                break;
            default:
                errorMessage = `Unhandled Prisma error: ${error.message}`;
                break;
        }

        return new AppError(400, errorMessage, error, errors, errorStatus, isOperational);
    }
}
