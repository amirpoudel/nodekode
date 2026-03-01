// ─── OTP ───────────────────────────────────────────────────────────────────

export function getRandomOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginationResult {
    limit: number;
    offset: number;
    page: number;
}

export function getLimitAndOffset(query: Record<string, any>): PaginationResult {
    const limit = query.limit ? parseInt(query.limit) : 20;
    const page = query.page ? parseInt(query.page) : 1;
    const offset = (page - 1) * limit;
    return { limit, offset, page };
}

// ─── Sorting ───────────────────────────────────────────────────────────────

export function getSortKeyWithOrder(query: Record<string, any>): { [key: string]: 1 | -1 } {
    const sort = query.sort ?? "createdAt";
    const order: 1 | -1 = query.order ? (query.order === "asc" ? 1 : -1) : -1;
    return { [sort]: order };
}

// ─── Date Range ────────────────────────────────────────────────────────────

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export type TimePeriod = "today" | "week" | "month" | "year";

export function getDateRangeFromTimePeriod(timePeriod: TimePeriod): DateRange | undefined {
    const date = new Date();

    if (timePeriod === "today") {
        return {
            startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
        };
    }

    if (timePeriod === "week") {
        const weekStart = date.getDate() - date.getDay();
        return {
            startDate: new Date(date.getFullYear(), date.getMonth(), weekStart),
            endDate: new Date(date.getFullYear(), date.getMonth(), weekStart + 6, 23, 59, 59, 999),
        };
    }

    if (timePeriod === "month") {
        return {
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    if (timePeriod === "year") {
        return {
            startDate: new Date(date.getFullYear(), 0, 1),
            endDate: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
        };
    }

    return undefined;
}

// ─── Type Coercion ─────────────────────────────────────────────────────────

export function stringToBoolean(value: string | boolean): boolean {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return Boolean(value);
}

// ─── Date Formatting ───────────────────────────────────────────────────────

export function convertToLongDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
    };
    return new Date(date).toLocaleDateString("en-US", options);
}

// ─── Password ──────────────────────────────────────────────────────────────

export function generateRandomPassword(length: number = 8): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () =>
        charset[Math.floor(Math.random() * charset.length)]
    ).join("");
}

// ─── Validation ────────────────────────────────────────────────────────────

export function isValidEmail(email: any): boolean {
    if (!email || typeof email !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: any): boolean {
    if (!url || typeof url !== "string") return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ─── String Utils ──────────────────────────────────────────────────────────

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function capitalize(text: string): string {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ─── Object Utils ──────────────────────────────────────────────────────────

/**
 * Removes keys with null/undefined values from an object.
 */
export function removeNullish<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
    ) as Partial<T>;
}

/**
 * Picks specific keys from an object.
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    return keys.reduce((acc, key) => {
        if (key in obj) acc[key] = obj[key];
        return acc;
    }, {} as Pick<T, K>);
}

/**
 * Omits specific keys from an object.
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((k) => delete result[k]);
    return result as Omit<T, K>;
}
