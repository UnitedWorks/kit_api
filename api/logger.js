import winston from 'winston';

winston.emitErrs = true;

export const logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: './logs/info.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, //5MB
      maxFiles: 5,
      colorize: false,
      timestamp: true
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true,
      colorize: true
    })
  ],
  exitOnError: false
});

export const stream = {
  write: (message, encoding) => {
    logger.info(message);
  }
};
