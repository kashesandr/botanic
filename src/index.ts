import {CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceBot} from "./binance-bot.js";
import {BinanceNewOrderComplete, NewOrder} from "./types/order.interface.js";
import {logger} from "./logger.js";
// import * as database from './database.js';
import {BINANCE_API_KEY, BINANCE_API_KEY_SECRET, BINANCE_API_URL} from "./configs.js";

const bot = new BinanceBot(BINANCE_API_KEY, BINANCE_API_KEY_SECRET, BINANCE_API_URL);

// we try to make profit when buy/sell BUSD with USDT
// we have a budget e.g. 1000 USDT

// WHEN app starts
// THEN the bot should open order to buy BUSD
// AND wait until the order completes
// THEN create order to sell BUSD with higher price
// AND wait until the order completes

const start = async () => {

    // await database.connect();
    // const marketPrice = await bot.getExchangePriceByTicker(CurrencyPairTickerEnum.BUSDUSDT);

    const newOrderBuy: NewOrder = {
        baseQuantity: 11,
        basePrice: 0.9990,
        baseCurrencyTicker: CurrencyTickerEnum.USDT,
        currencyTicker: CurrencyTickerEnum.BUSD
    }

    const newOrderSell: NewOrder = {
        baseQuantity: 11,
        basePrice: 1.1,
        baseCurrencyTicker: CurrencyTickerEnum.BUSD,
        currencyTicker: CurrencyTickerEnum.USDT
    }

    const res: BinanceNewOrderComplete = await bot.placeBuyLimitOrder(newOrderBuy);
    bot.subscribeOnceOnOrderFinished(res, (d) => {
        logger.debug('subscribeOnceOnOrderComplete', d);
    });

    const res2: BinanceNewOrderComplete = await bot.placeSellLimitOrder(newOrderSell);
    bot.subscribeOnceOnOrderFinished(res2, (d) => {
        logger.debug('subscribeOnceOnOrderComplete', d);
    });

};

export default {start};