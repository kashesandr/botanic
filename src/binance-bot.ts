import {Spot as BinanceSpot} from '@binance/connector';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceNewOrderComplete, BinanceOrder, BinanceOrderDetails, NewOrder} from "./types/order.interface.js";
import {PubSub} from "./pubsub.js";
import {BinanceTradingSideEnum, BinanceOrderStatusEnum} from "./constants/order.enum.js";
import {logger, LoggerDebugInputParams, LoggerTryCatchExceptionAsync} from './logger.js';
import {setTimeoutPromise} from "./helpers.js";

const loggerPrefix = 'BinanceBot';

export class BinanceBot {

    pubsub = new PubSub();
    binanceConnectClient: BinanceSpot = null;

    constructor(private apiKey: string, private apiSecret: string, private baseURL: string) {

        if (!apiKey || !apiSecret) {
            logger.error('Error creating Binance Bot, API keys not provided');
            throw new Error('Error creating Binance Bot, API keys not provided');
        } else {
            this.binanceConnectClient = new BinanceSpot(this.apiKey, this.apiSecret, {baseURL: this.baseURL, logger});
            this.ordersCheckLoop(5000);
        }

    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    public async getBalanceByTicker(ticker: CurrencyTickerEnum): Promise<number> {
        const {data} = await this.binanceConnectClient.userAsset({asset: ticker});
        return Number(data[0]?.free);
    }

    @LoggerDebugInputParams(loggerPrefix)
    public async isEnoughBalance(ticker: CurrencyTickerEnum, requiredBalance: number): Promise<boolean> {
        const currentBalance = await this.getBalanceByTicker(ticker);
        return currentBalance >= requiredBalance
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    public async getExchangePriceByTicker(exchangePairTicker: CurrencyPairTickerEnum): Promise<number> {
        const {data} = await this.binanceConnectClient.tickerPrice(exchangePairTicker);
        return data?.price;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    public async placeBuyLimitOrder({basePrice, baseQuantity, baseCurrencyTicker, currencyTicker}: NewOrder): Promise<BinanceNewOrderComplete> {
        const hasEnoughBalanceToBuy = await this.isEnoughBalance(baseCurrencyTicker, baseQuantity);
        if (!hasEnoughBalanceToBuy) {
            logger.error(`${loggerPrefix}: Error placing the BUY order: insufficient ${baseCurrencyTicker} balance ${baseQuantity}`)
            return null;
        }
        const symbol = `${currencyTicker}${baseCurrencyTicker}`;
        const {data} = await this.binanceConnectClient.newOrder(symbol, BinanceTradingSideEnum.BUY, 'LIMIT', {
            price: basePrice.toString(),
            baseQuantity: baseQuantity,
            timeInForce: 'GTC'
        })
        logger.info(`Order placed successfully: ${data}`)
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    public async placeSellLimitOrder({basePrice, baseQuantity, baseCurrencyTicker, currencyTicker}: NewOrder): Promise<BinanceNewOrderComplete> {
        const hasEnoughBalanceToBuy = await this.isEnoughBalance(baseCurrencyTicker, baseQuantity);
        if (!hasEnoughBalanceToBuy) {
            logger.error(`${loggerPrefix}: Error placing the SELL order: insufficient ${baseCurrencyTicker} balance ${baseQuantity}`)
            return null;
        }
        const symbol = `${currencyTicker}${baseCurrencyTicker}`;
        const {data} = await this.binanceConnectClient.newOrder(symbol, BinanceTradingSideEnum.SELL, 'LIMIT', {
            price: basePrice.toString(),
            baseQuantity: baseQuantity,
            timeInForce: 'GTC'
        })
        logger.info(`Order placed successfully: ${data}`)
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    public async getOrderDetails(ticker: CurrencyPairTickerEnum, orderId: number): Promise<BinanceOrderDetails> {
        const {data} = await this.binanceConnectClient.getOrder(ticker, {orderId});
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    public subscribeOnceOnOrderFinished(order: BinanceOrder, callback: Function) {
        if (!order) {
            logger.error(`${loggerPrefix}: No order provided`)
            return;
        }
        const key = this.getOrderWatchKey(order);
        this.pubsub.subscribe(key, callback, true);
    }

    @LoggerDebugInputParams(loggerPrefix)
    private async ordersCheck(): Promise<BinanceOrder[]> {
        const keys = Object.keys(this.pubsub.pubsubStore);
        const promises = keys.map(key => {
            const {symbol, orderId} = this.getSymbolAndIdFromOrderWatchKey(key);
            return this.getOrderDetails(symbol, orderId)
        })
        const orders = await Promise.all(promises);
        const ordersFilled: BinanceOrder[] = [];
        orders.forEach(order => {
            if (order.status !== BinanceOrderStatusEnum.NEW) {
                ordersFilled.push(order);
                const key = this.getOrderWatchKey(order);
                this.pubsub.publish<BinanceOrderDetails>(key, order);

            }
        });
        return ordersFilled;
    }

    private getOrderWatchKey(order: BinanceOrder): string {
        return `${order.symbol}-${order.orderId}`;
    }

    private getSymbolAndIdFromOrderWatchKey(key: string): { symbol: CurrencyPairTickerEnum, orderId: number } {
        const [symbol, orderId] = key.split('-');
        return {
            symbol: symbol as CurrencyPairTickerEnum,
            orderId: Number(orderId)
        }
    }

    // TODO: start and stop loop depending on watched orders
    @LoggerDebugInputParams(loggerPrefix)
    private async ordersCheckLoop(timeout = 5000): Promise<void> {
        const ordersNotInNewState: BinanceOrder[] = await this.ordersCheck();
        if (ordersNotInNewState?.length > 0) {
            // TODO: find out why the store is not updated

            logger.info(`Orders changed state from ${BinanceOrderStatusEnum.NEW}: ${ordersNotInNewState.length}`)
        }
        await setTimeoutPromise(timeout);
        await this.ordersCheckLoop();
    }

    // public calculateProfit(): number {
    //
    // }

}



