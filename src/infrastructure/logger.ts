import pino, { Logger } from 'pino';

const level = process.env.LOG_LEVEL || 'info';
const service = process.env.SERVICE_NAME || 'orquestador-solicitudes-micro';
const env = process.env.ENV || 'dev';

export const logger: Logger = pino({
  level,
  base: { service, env },
  timestamp: pino.stdTimeFunctions.isoTime
});

export default logger;