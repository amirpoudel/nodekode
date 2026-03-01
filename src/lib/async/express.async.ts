import { Request, Response, NextFunction } from "express";

export const asyncHandler = (requestHandler: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await Promise.resolve(requestHandler(req, res, next));
        } catch (error) {
            next(error);
        }
    };
};
