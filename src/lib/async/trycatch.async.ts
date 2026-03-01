import { AppError } from "../error/app.error";

/**
 * Generic try/catch wrapper — re-throws the original error.
 */
export const trycatchWrapper = (fn: Function) => {
    return async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw error;
        }
    };
};

/**
 * Wraps a function and converts Mongoose errors into AppError.mongoError.
 */
export const trycatchWrapperMongo = (fn: Function) => {
    return async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw AppError.mongoError("Mongo Error", error);
        }
    };
};

/**
 * Wraps a function and converts Prisma errors into AppError.prismaError.
 */
export const trycatchWrapperPrisma = (fn: Function) => {
    return async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw AppError.prismaError("Prisma Error", error);
        }
    };
};
