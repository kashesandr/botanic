import dotenv from 'dotenv';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceBot} from "./bot.js";
import {BinanceNewOrderComplete} from "./types/order.interface.js";
dotenv.config({ path: process.cwd()+'/.env' });

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

        const orderQuantity = 11;
        const hasEnoughBalance = await bot.isEnoughBalance(CurrencyTickerEnum.USDT, orderQuantity);
        const marketPrice = await bot.getExchangePriceByTicker(CurrencyPairTickerEnum.BUSDUSDT);
        const orderPrice = 0.9999;
        console.log(`${CurrencyPairTickerEnum.BUSDUSDT}: marketPrice=${marketPrice}, orderPrice=${orderPrice}`)

        if (hasEnoughBalance) {
            const res: BinanceNewOrderComplete = await bot.placeBuyLimitOrder(CurrencyPairTickerEnum.BUSDUSDT, orderPrice, orderQuantity)
            bot.subscribeOnceOnOrderComplete(res, (d) => {
                console.log('subscribeOnceOnOrderComplete', d);
            })
        }

};

export default { start };