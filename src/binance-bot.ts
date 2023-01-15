import {Spot as BinanceSpot} from '@binance/connector';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceNewOrderComplete, BinanceOrder, BinanceOrderDetails, NewOrder} from "./types/order.interface.js";
import {PubSub} from "./pubsub.js";
import {BinanceOrderStatusEnum, BinanceTradingSideEnum} from "./constants/order.enum.js";
import {logger, LoggerDebugInputParams, LoggerTryCatchExceptionAsync} from './logger.js';
import {setTimeoutPromise} from "./helpers.js";
import {Retryable} from "typescript-retry-decorator";

const loggerPrefix = 'BinanceBot';
const CHECK_ORDERS_LOOP_TIMEOUT = 1000*10;

export class BinanceBot {

    pubsub = new PubSub();
    binanceConnectClient: BinanceSpot = null;

    constructor(private apiKey: string, private apiSecret: string, private baseURL: string) {

        if (!apiKey || !apiSecret) {
            logger.error('Error creating Binance Bot, API keys not provided');
            throw new Error('Error creating Binance Bot, API keys not provided');
        } else {
            this.binanceConnectClient = new BinanceSpot(this.apiKey, this.apiSecret, {baseURL: this.baseURL, logger});
            this.runOrdersCheckLoopInBackground(CHECK_ORDERS_LOOP_TIMEOUT);
        }

    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    @Retryable({maxAttempts: 3, backOff: 2000})
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
    @Retryable({maxAttempts: 3, backOff: 2000})
    public async getExchangePriceByTicker(exchangePairTicker: CurrencyPairTickerEnum): Promise<number> {
        const {data} = await this.binanceConnectClient.tickerPrice(exchangePairTicker);
        return data?.price;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    @Retryable({maxAttempts: 3, backOff: 2000})
    public async placeBuyLimitOrder({basePrice, baseQuantity, baseCurrencyTicker, currencyTicker}: NewOrder): Promise<BinanceNewOrderComplete> {
        const hasEnoughBalanceToBuy = await this.isEnoughBalance(baseCurrencyTicker, baseQuantity);
        if (!hasEnoughBalanceToBuy) {
            logger.error(`${loggerPrefix}: Error placing the BUY order: insufficient ${baseCurrencyTicker} balance ${baseQuantity}`)
            return null;
        }
        const symbol = `${currencyTicker}${baseCurrencyTicker}`;
        const {data} = await this.binanceConnectClient.newOrder(symbol, BinanceTradingSideEnum.BUY, 'LIMIT', {
            price: basePrice.toString(),
            quantity: baseQuantity,
            timeInForce: 'GTC'
        })
        logger.info(`Order ${data.orderId} placed successfully: ${BinanceTradingSideEnum.BUY} ${currencyTicker} (${baseCurrencyTicker} ${baseQuantity})`)
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    @Retryable({maxAttempts: 3, backOff: 2000})
    public async placeSellLimitOrder({basePrice, baseQuantity, baseCurrencyTicker, currencyTicker}: NewOrder): Promise<BinanceNewOrderComplete> {
        const hasEnoughBalanceToBuy = await this.isEnoughBalance(baseCurrencyTicker, baseQuantity);
        if (!hasEnoughBalanceToBuy) {
            logger.error(`${loggerPrefix}: Error placing the SELL order: insufficient ${baseCurrencyTicker} balance ${baseQuantity}`)
            return null;
        }
        const symbol = `${baseCurrencyTicker}${currencyTicker}`;
        const {data} = await this.binanceConnectClient.newOrder(symbol, BinanceTradingSideEnum.SELL, 'LIMIT', {
            price: basePrice.toString(),
            quantity: baseQuantity,
            timeInForce: 'GTC'
        })
        logger.info(`Order placed successfully: ${BinanceTradingSideEnum.SELL} ${currencyTicker} (${baseCurrencyTicker} ${baseQuantity})`)
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    @LoggerTryCatchExceptionAsync(loggerPrefix)
    @Retryable({maxAttempts: 3, backOff: 2000})
    public async getOrderDetails(ticker: CurrencyPairTickerEnum, orderId: number): Promise<BinanceOrderDetails> {
        const {data} = await this.binanceConnectClient.getOrder(ticker, {orderId});
        return data;
    }

    @LoggerDebugInputParams(loggerPrefix)
    public async subscribeOnceOnOrderFinished(order: BinanceOrder): Promise<BinanceOrderDetails> {
        return new Promise((resolve) => {
            if (!order) {
                logger.error(`${loggerPrefix}: No order provided`)
                return;
            }
            const key = this.getOrderWatchKey(order);
            this.pubsub.subscribe(key, (order: BinanceOrderDetails) => {
                resolve(order);
            }, true);
        });
    }

    @LoggerDebugInputParams(loggerPrefix)
    private async ordersCheck(items: [orderId: number, symbol: CurrencyPairTickerEnum][]): Promise<BinanceOrder[]> {
        const promises = items.map(([orderId, symbol]) => {
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
    private async runOrdersCheckLoopInBackground(timeout: number): Promise<void> {

        const keys = Object.keys(this.pubsub.pubsubStore);
        const orderIdSymbolsArr: [number, CurrencyPairTickerEnum][] = keys.map(key => {
            const {symbol, orderId} = this.getSymbolAndIdFromOrderWatchKey(key);
            return [orderId, symbol]
        })

        const ordersNotInNewState: BinanceOrder[] = await this.ordersCheck(orderIdSymbolsArr);
        ordersNotInNewState.forEach( (order) => {
            logger.debug(`Order ${order.orderId} ${order.symbol} changed state.`)
        })

        await setTimeoutPromise(timeout);
        await this.runOrdersCheckLoopInBackground(timeout);
    }

    // public calculateProfit(): number {
    //
    // }

}



