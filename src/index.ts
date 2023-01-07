import {Spot} from '@binance/connector';

import dotenv from 'dotenv';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceBot} from "./bot.js";

dotenv.config({ path: process.cwd()+'/.env' });
const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_API_KEY_SECRET;

const baseURL = process.env.BINANCE_API_URL ?? null;
const client = new Spot(apiKey, apiSecret, { baseURL });
const bot = new BinanceBot(client);

const start = async () => {


        // client.logger.log(data);
        // const balance = await bot.getBalanceByTicker(CurrencyTickerEnum.USDT);

        const orderQuantity = 11;
        const orderPrice = 0.9999;
        const hasEnoughBalance = await bot.isEnoughBalance(CurrencyTickerEnum.USDT, orderQuantity);
        // const marketPrice = await bot.getExchangePriceByTicker(CurrencyPairTickerEnum.BUSDUSDT);

        if (hasEnoughBalance) {
            const res = await bot.placeBuyLimitOrder(CurrencyPairTickerEnum.BUSDUSDT, orderPrice, orderQuantity)
            console.log(123, res);
        }

        // we try to make profit when buy/sell BUSD with USDT
        // we have a budget e.g. 1000 USDT

        // WHEN app starts
        // THEN the bot should open order to buy BUSD
        // AND wait until the order completes
        // THEN create order to sell BUSD with higher price
        // AND wait until the order completes

};

export default {start};