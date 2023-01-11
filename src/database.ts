import {MONGO_DB_NAME, MONGO_DB_URL} from "./configs.js";
import {logger} from "./logger.js";
import mongoose, {Connection} from 'mongoose';

export const connect = (): Promise<Connection> => {
    return new Promise((resolve: (Connection) => unknown, reject) => {
        const mongoUrl: string = `${MONGO_DB_URL}/${MONGO_DB_NAME}`;
        mongoose.connect(mongoUrl)
        const db: Connection = mongoose.connection
        db.on('error', err => {
            reject(false);
            logger.error(err);
        })
        db.once('open', () => {
            logger.info(`Connected to ${mongoUrl}`)
            resolve(db);
        })
    })
}
