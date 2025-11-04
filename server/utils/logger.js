const pino = require('pino');
const pinoHttp = require('pino-http');

const level = process.env.LOG_LEVEL || 'info';
const isDev = process.env.NODE_ENV !== 'production';

// Use pino.transport in dev to enable pino-pretty without changing production JSON format
const transport = isDev
  ? pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } })
  : undefined;

let logger;
const baseOpts = {
  level,
  // ISO timestamp for easier searching in logs
  timestamp: pino.stdTimeFunctions.isoTime
};

if (transport) {
  logger = pino(baseOpts, transport);
} else {
  logger = pino(baseOpts);
}

const httpLogger = pinoHttp({ logger });

module.exports = { logger, httpLogger };
