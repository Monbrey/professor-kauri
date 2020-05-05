import { createLogger, format, transports } from "winston";
import KauriClient from "../../client/KauriClient";
import { DiscordTransport } from "./discord-transport";

const { combine, timestamp, printf, colorize } = format;

const stringFormat = printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`);

const errorParser = format(info => info instanceof Error ? Object.assign({ message: `${info.stack}` }, info) : info);

const isError = format((info, opts) => (info.level === "error") === opts ? info : false);

const combinedFormat = combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errorParser(),
    stringFormat
);

export const createCustomLogger = (client: KauriClient) => {
    const logger = createLogger({
        format: combinedFormat,
        transports: [
            new transports.File({ filename: "./logs/professor-kauri-error.log", level: "error", format: combine(isError(true), combinedFormat) }),
            new transports.File({ filename: "./logs/professor-kauri.log", level: "info", format: combine(isError(false), combinedFormat) }),
            new DiscordTransport({ level: "info", client })
        ]
    });

    if (process.env.NODE_ENV !== "production") {
        logger.add(new transports.Console({ level: "debug" }));
    }

    return logger;
};

