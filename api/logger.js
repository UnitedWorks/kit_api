import winston from 'winston';

winston.emitErrs = true;

export const logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      name: 'info-file',
      level: 'info',
      filename: './logs/info.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880,
      maxFiles: 5,
      colorize: false,
      timestamp: true,
    }),
    new winston.transports.File({
      name: 'error-file',
      level: 'error',
      filename: './logs/error.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880,
      maxFiles: 5,
      colorize: false,
      timestamp: true,
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true,
      colorize: true,
    }),
  ],
  exitOnError: false,
});

export const stream = {
  write: (message, encoding) => {
    logger.info(message);
  },
};
