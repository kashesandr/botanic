import dotenv from "dotenv";

dotenv.config({path: process.cwd() + '/.env'});

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
export const BINANCE_API_KEY_SECRET = process.env.BINANCE_API_KEY_SECRET;
export const BINANCE_API_URL = process.env.BINANCE_API_URL ?? null;

export const MONGO_DB_URL = process.env.MONGO_DB_URL;
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME;