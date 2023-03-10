import {CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceBot} from "./binance-bot.js";
import {BinanceNewOrderComplete, NewOrder} from "./types/order.interface.js";
import {BINANCE_API_KEY, BINANCE_API_KEY_SECRET, BINANCE_API_URL} from "./configs.js";
import {logger} from "./logger.js";
const bot = new BinanceBot(BINANCE_API_KEY, BINANCE_API_KEY_SECRET, BINANCE_API_URL);
// import * as database from './database.js';

// we try to make profit when buy/sell BUSD with USDT
// we have a budget e.g. 1000 USDT

// WHEN app starts
// THEN the bot should open order to buy BUSD
// AND wait until the order completes
// THEN create order to sell BUSD with higher price
// AND wait until the order completes

const newOrderBuy: NewOrder = {
    baseQuantity: 11,
    basePrice: 0.9999,
    baseCurrencyTicker: CurrencyTickerEnum.USDT,
    currencyTicker: CurrencyTickerEnum.BUSD
}

const newOrderSell: NewOrder = {
    baseQuantity: 11,
    basePrice: 1.0001,
    baseCurrencyTicker: CurrencyTickerEnum.BUSD,
    currencyTicker: CurrencyTickerEnum.USDT
}

const start = async () => {

    // await database.connect();
    // const marketPrice = await bot.getExchangePriceByTicker(CurrencyPairTickerEnum.BUSDUSDT);

    const buyBinanceOrder: BinanceNewOrderComplete = await bot.placeBuyLimitOrder(newOrderBuy);
    const buyBinanceOrderCompleted = await bot.subscribeOnceOnOrderFinished(buyBinanceOrder);
    logger.info(`Order ${buyBinanceOrderCompleted.orderId} changed status to ${buyBinanceOrderCompleted.status}`);

    const sellBinanceOrder: BinanceNewOrderComplete = await bot.placeSellLimitOrder(newOrderSell);
    const sellBinanceOrderCompleted = await bot.subscribeOnceOnOrderFinished(sellBinanceOrder);
    logger.info(`Order ${sellBinanceOrderCompleted.orderId} changed status to ${sellBinanceOrderCompleted.status}`);

    await start();

};

export default {start};