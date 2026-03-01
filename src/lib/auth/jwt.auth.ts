import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AppError } from "../error/app.error";

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? "";
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET ?? "";
const accessTokenExpiry = (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];
const refreshTokenExpiry = (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, accessTokenSecret, { expiresIn: accessTokenExpiry });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenExpiry });
};

export const generateAccessAndRefreshToken = (
    payload: JwtPayload
): { accessToken: string; refreshToken: string } => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

export const verifyAccessToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, accessTokenSecret) as JwtPayload;
    } catch (error) {
        throw AppError.invalidCredentials("Invalid access token");
    }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, refreshTokenSecret) as JwtPayload;
    } catch (error) {
        throw AppError.invalidCredentials("Invalid refresh token");
    }
};
