import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceBot} from "./binance-bot.js";
import {BinanceNewOrderComplete, NewOrder} from "./types/order.interface.js";
import dotenv from 'dotenv';
import {logger} from "./logger.js";

dotenv.config({path: process.cwd() + '/.env'});

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_API_KEY_SECRET;
const baseURL = process.env.BINANCE_API_URL ?? null;
const bot = new BinanceBot(apiKey, apiSecret, baseURL);


// we try to make profit when buy/sell BUSD with USDT
// we have a budget e.g. 1000 USDT

// WHEN app starts
// THEN the bot should open order to buy BUSD
// AND wait until the order completes
// THEN create order to sell BUSD with higher price
// AND wait until the order completes

const start = async () => {

    const newOrder: NewOrder = {
        quantity: 11,
        price: 0.9999,
        symbol: CurrencyPairTickerEnum.BUSDUSDT
    }
    const hasEnoughBalance = await bot.isEnoughBalance(CurrencyTickerEnum.USDT, newOrder.quantity);
    const marketPrice = await bot.getExchangePriceByTicker(CurrencyPairTickerEnum.BUSDUSDT);
    logger.debug(`${CurrencyPairTickerEnum.BUSDUSDT}: marketPrice=${marketPrice}, orderPrice=${newOrder.price}`)

    if (hasEnoughBalance) {
        const res: BinanceNewOrderComplete = await bot.placeBuyLimitOrder(newOrder);
        bot.subscribeOnceOnOrderFinished(res, (d) => {
            logger.debug('subscribeOnceOnOrderComplete', d);
        })
    }

};

export default {start};