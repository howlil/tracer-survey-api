const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf, colorize } = format;
const globalUtils = require('../utils/global.util');

class LoggerConfig {
    static levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 5
    };

    static colors = {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue',
    };

    constructor() {
        winston.addColors(LoggerConfig.colors);
        this.logger = this.#createLogger();
    }

    #createLogger() {
        return logger = createLogger({
            levels: this.levels,
            format: this.#getLogFormat(),
            transports: this.#getTransports(),
            exitOnError: false
        });
    }

    #fileFormat() {
        return format.combine(
            format.timestamp({ format: ' HH:mm:ss DD-MM-YYYY' }),
            format.json(),
            format.errors({ stack: true }),
        );
    }

    #consoleFormat() {
        return combine(
            colorize({ all: true }),
            timestamp({ format: ' HH:mm:ss DD-MM-YYYY' }),
            format.errors({ stack: true }),
            printf(({ timestamp, level, message, stack }) => {
                return `${timestamp} ${level}: ${stack || message}`;
            })
        );
    }

    #getTransports() {
        const transportsList = [
            new transports.Console({
                format: this.#getLogFormat(),
                level: this.#getLogLevel(),
            }),
            new DailyRotateFile({
                filename: 'logs/info/app-%DATE%.log',
                datePattern: 'DD-MM-YYYY',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: this.fileFormat,
                level: 'info',
            }),
            new DailyRotateFile({
                filename: 'logs/errors/error-%DATE%.log',
                datePattern: 'DD-MM-YYYY',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '30d',
                format: this.fileFormat,
                level: 'error',
            })

        ]
        return transportsList;
    }

    #getLogLevel() {
        return globalUtils.isDevelopment ? 'debug' : 'info';
    }

    #getLogFormat() {
        return globalUtils.isDevelopment ? this.#consoleFormat() : this.#fileFormat();
    }

    getLogger() {
        return this.logger;
    }

}

module.exports = new LoggerConfig().getLogger();