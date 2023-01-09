import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
export const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.json(),
    transports: [],
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
        desc.value = function (...args: any[]) {
            logger.debug(`${prefix}.${name}: ${JSON.stringify(arguments)}`);
            return methodName.apply(this, args);
        }
    }
}

export const LoggerTryCatchExceptionAsync = (prefix: string) => {
    // @ts-ignore
    return (target: unknown, nameMethod: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value
        descriptor.value = async function (...args: any[]) {
            try {
                const executionMethod = await originalMethod.apply(this, args)
                return executionMethod
            }  catch (error) {
                logger.error(error);
                throw new Error(`${prefix}: ${error?.message ?? error}`)
            }
        }
    }
}