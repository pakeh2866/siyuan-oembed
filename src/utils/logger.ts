export const logSuccess = (operation: string) => console.log(`${operation} completed successfully`);

export const logError = (operation: string, error: unknown) => console.error(`Error during ${operation}:`, error);
