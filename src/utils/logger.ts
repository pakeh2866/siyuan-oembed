import { i18n } from "@/i18n";

export const logSuccess = (operation: string) => console.log(`${operation} completed successfully`);

export const logError = (operation: string, error: unknown) => console.error(`Error during ${operation}:`, error);

import { settings } from "../settings";

class Logger {
    private static instance: Logger;

    private constructor() {} // private constructor to prevent direct instantiation

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    debug(message: string, ...optionalParams: any[]): void {
        if (settings.get("EnableDebug")) {
            console.debug(`[DEBUG][${i18n.name}] ${message}`, ...optionalParams);
        }
    }

    info(message: string, ...optionalParams: any[]): void {
        console.info(`[INFO][${i18n.name}] ${message}`, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]): void {
        console.warn(`[WARN][${i18n.name}] ${message}`, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]): void {
        console.error(`[ERROR][${i18n.name}] ${message}`, ...optionalParams);
    }
}

export const logger = Logger.getInstance();
