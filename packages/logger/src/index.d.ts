import { Logger } from 'pino';

/**
 * Declares the type for the logger instance.
 * This allows other TypeScript-aware services to understand the
 * shape of the logger object, providing autocompletion and type safety.
 */
declare const logger: Logger;
export default logger;
