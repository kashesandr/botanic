import { Spot } from '@binance/connector';

import dotenv from 'dotenv';
import {CurrenciesEnum} from "./constants/currencies.enum.js";
dotenv.config({ path: process.cwd()+'/.env' });
const apiKey = process.env.BINANCE_API_KEY;
// const apiSecret = process.env.BINANCE_API_KEY_SECRET;

const client = new Spot(apiKey, '');

const start = async () => {

    try {

        const {data} = await client.tickerPrice(CurrenciesEnum.BUSDUSDT);
        console.log(data);

    } catch (e) {
        console.error(e);
    }

};

export default {start};