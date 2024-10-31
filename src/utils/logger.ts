export const logSuccess = (operation: string) => console.log(`${operation} completed successfully`);

export const logError = (operation: string, error: unknown) => console.error(`Error during ${operation}:`, error);

// import { settings } from "./settings";

export const settings = {
    debug: true, // Set this to false to disable debug logging
};

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
        if (settings.debug) {
            console.debug(`[DEBUG] ${message}`, ...optionalParams);
        }
    }

    info(message: string, ...optionalParams: any[]): void {
        console.info(`[INFO] ${message}`, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]): void {
        console.warn(`[WARN] ${message}`, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]): void {
        console.error(`[ERROR] ${message}`, ...optionalParams);
    }
}

export const logger = Logger.getInstance();
