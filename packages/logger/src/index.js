import pino from 'pino';

// Configure the logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Use pino-pretty for human-readable logs in development,
  // and structured JSON logs in production.
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;