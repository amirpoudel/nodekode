// ─── Error ─────────────────────────────────────────────────────────────────
export { AppError } from "./lib/error/app.error";
export { expressErrorHandler } from "./lib/error/handler.error";
export { createLogger } from "./lib/error/logs.error";

// ─── API ───────────────────────────────────────────────────────────────────
export { ApiError } from "./lib/api/error.api";
export { ApiResponse } from "./lib/api/response.api";

// ─── Async Wrappers ────────────────────────────────────────────────────────
export { asyncHandler } from "./lib/async/express.async";
export {
    trycatchWrapper,
    trycatchWrapperMongo,
    trycatchWrapperPrisma,
} from "./lib/async/trycatch.async";

// ─── Storage ───────────────────────────────────────────────────────────────
export type { IStorageProvider } from "./lib/storage/storage.interface";
export { S3Storage } from "./lib/storage/s3.storage";
export { AzureStorage } from "./lib/storage/azure.storage";
export type { S3StorageConfig } from "./lib/storage/s3.storage";
export type { AzureStorageConfig } from "./lib/storage/azure.storage";

// ─── Auth ──────────────────────────────────────────────────────────────────
export {
    generateAccessToken,
    generateRefreshToken,
    generateAccessAndRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} from "./lib/auth/jwt.auth";
export { hashPassword, comparePassword } from "./lib/auth/bcrypt.auth";

// ─── Helpers ───────────────────────────────────────────────────────────────
export {
    getRandomOtp,
    getLimitAndOffset,
    getSortKeyWithOrder,
    getDateRangeFromTimePeriod,
    stringToBoolean,
    convertToLongDate,
    generateRandomPassword,
    isValidEmail,
    isValidUrl,
    slugify,
    capitalize,
    removeNullish,
    pick,
    omit,
} from "./lib/helpers/helper";
export type {
    PaginationResult,
    DateRange,
    TimePeriod,
} from "./lib/helpers/helper";
