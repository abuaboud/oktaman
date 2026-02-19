import pino from 'pino';
import { LOG_LEVEL } from './system';

const logger = pino(
    {
        level: LOG_LEVEL,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
                messageFormat: '{msg}',
                customColors: 'info:cyan,warn:yellow,error:red,debug:magenta,trace:gray,fatal:bgRed',
                errorLikeObjectKeys: ['err', 'error'],
                singleLine: false,
                hideObject: false,
                levelFirst: false,
                sync: false,
                destination: 1,
                append: false
            }
        },
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            }
        },
        serializers: {
            req: (req) => ({
                method: req.method,
                url: req.url,
                remoteAddress: req.socket?.remoteAddress,
                remotePort: req.socket?.remotePort
            }),
            res: (res) => ({
                statusCode: res.statusCode
            }),
            err: pino.stdSerializers.err
        }
    } 
);

export { logger };
