import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
export const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/debug.log', level: 'debug' }),
        new winston.transports.File({ filename: './logs/info.log', level: 'info' }),
    ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (!isProduction) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

export const LoggerDebugInputParams = (prefix: string) => {
    // @ts-ignore
    return (target: unknown, name: string, desc: PropertyDescriptor) => {
        const methodName = desc.value;
        desc.value = function (...args: unknown[]) {
            logger.debug(`${prefix}.${name}: ${JSON.stringify(arguments)}`);
            return methodName.apply(this, args);
        }
    }
}

export const LoggerTryCatchExceptionAsync = (prefix: string) => {
    // @ts-ignore
    return (target: unknown, nameMethod: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value
        descriptor.value = async function (...args: unknown[]) {
            try {
                return await originalMethod.apply(this, args);
            }  catch (error) {
                logger.error(error);
                throw new Error(`${prefix}: ${error?.message ?? error}`);
            }
        }
    }
}