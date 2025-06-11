/* eslint-disable max-classes-per-file */
// Builtin.
import process from 'process';
// 3rd party.
import {
    createLogger, config, format, transports, Logger as WinstonLogger,
} from 'winston';
// Internal.
import { logConfig, serviceConfig } from '@/config';
import { isEmpty } from '@/lib/utils/utils';

type ErrorWithStack = Error & { stack?: object };

const loggerConfig = {
    level: logConfig.LEVEL,
    levels: {
        ...config.npm.levels,
    },
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json(),
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.prettyPrint(),
                format.printf(
                    ({
                        level, message, timestamp, loggerName, err, stack, ...meta
                    }) => {
                        let metaStr;
                        try {
                            metaStr = isEmpty(meta) ? '' : ` ${JSON.stringify(meta)}`;
                        } catch {
                            metaStr = '';
                        }
                        const stackTrace = ((err as ErrorWithStack)?.stack || stack)
                            ? `\r\n${(err as ErrorWithStack)?.stack || stack}`
                            : '';
                        return `[${level.toUpperCase()}] ${timestamp} [${process.pid}]: [${loggerName}] ${message}${metaStr}${stackTrace}`;
                    },
                ),
            ),
            handleExceptions: true,
            level: logConfig.LEVEL,
            silent: logConfig.SILENT,
        }),
    ],
};

const baseLogger: WinstonLogger = createLogger(loggerConfig);

const LoggerClass = (): new () => WinstonLogger => (class {} as never);

export class Logger extends LoggerClass() {
    private static FORCED_EXTRAS = {
        app: serviceConfig.APP_NAME,
        service: serviceConfig.NAME,
    };

    private _logger;

    // Define a handler that forwards all calls to underlying logger.
    private handler = {
        get(target: Logger, prop: string, receiver: unknown) {
            return Reflect.get(target._logger, prop, receiver);
        },
    };

    constructor(name: string, extra: Record<string, unknown> = {}) {
        super();
        this._logger = baseLogger.child({
            ...Logger.FORCED_EXTRAS,
            loggerName: name,
            ...extra,
        });
        return new Proxy(this, this.handler);
    }
}
