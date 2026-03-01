import winston from "winston";

// Custom format to include dynamic metadata
const dynamicMetaFormat = winston.format((info: any, opts: any) => {
    if (opts && opts.meta) {
        info.meta = opts.meta;
    }
    return info;
});

export const createLogger = (context: string) => {
    return winston.createLogger({
        level: "info",
        format: winston.format.combine(
            dynamicMetaFormat(),
            winston.format.json()
        ),
        defaultMeta: { service: context },
        transports: [
            new winston.transports.File({
                filename: "logs/error.log",
                level: "error",
            }),
            new winston.transports.File({
                filename: "logs/info.log",
                level: "info",
            }),
            new winston.transports.Console({
                format: winston.format.simple(),
            }),
        ],
    });
};
