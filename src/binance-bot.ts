import {Spot as BinanceSpot} from '@binance/connector';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceNewOrderComplete, BinanceOrder, BinanceOrderDetails} from "./types/order.interface.js";
import {PubSub} from "./pubsub.js";
import {BinanceOrderStatusEnum} from "./constants/order.enum.js";
import {logger, LoggerDebugInputParams, LoggerTryCatchExceptionAsync} from './logger.js';

export class BinanceBot {

    pubsub = new PubSub();
    watchedOrders: BinanceOrder[] = [];
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

    @LoggerDebugInputParams()
    @LoggerTryCatchExceptionAsync()
    public async getBalanceByTicker(ticker: CurrencyTickerEnum): Promise<number> {
        const {data} = await this.binanceConnectClient.userAsset({asset: ticker});
        return Number(data[0]?.free);
    }

    @LoggerDebugInputParams()
    public async isEnoughBalance(ticker: CurrencyTickerEnum, requiredBalance: number): Promise<boolean> {
        const currentBalance = await this.getBalanceByTicker(ticker);
        return currentBalance >= requiredBalance
    }

    @LoggerDebugInputParams()
    @LoggerTryCatchExceptionAsync()
    public async getExchangePriceByTicker(exchangePairTicker: CurrencyPairTickerEnum): Promise<number> {
        const {data} = await this.binanceConnectClient.tickerPrice(exchangePairTicker);
        return data?.price;
    }

    @LoggerDebugInputParams()
    @LoggerTryCatchExceptionAsync()
    public async placeBuyLimitOrder(exchangePairTicker: CurrencyPairTickerEnum, price: number, quantity: number): Promise<BinanceNewOrderComplete> {
        const {data} = await this.binanceConnectClient.newOrder(exchangePairTicker, 'BUY', 'LIMIT', {
            price: price.toString(),
            quantity,
            timeInForce: 'GTC'
        })
        logger.info(`Order placed successfully: ${data}`)
        return data;
    }

    @LoggerDebugInputParams()
    @LoggerTryCatchExceptionAsync()
    public async getOrderDetails(ticker: CurrencyPairTickerEnum, orderId: number): Promise<BinanceOrderDetails> {
        const {data} = await this.binanceConnectClient.getOrder(ticker, {orderId});
        return data;
    }

    @LoggerDebugInputParams()
    public subscribeOnceOnOrderFinished(order: BinanceOrder, callback: Function) {
        this.watchedOrders.push(order);
        const key = this.getOrderWatchKey(order);
        this.pubsub.subscribe(key, callback, true);
    }

    @LoggerDebugInputParams()
    private async ordersCheck(): Promise<BinanceOrder[]> {
        console.log(this.pubsub.pubsubStore);
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
    @LoggerDebugInputParams()
    private ordersCheckLoop(timeout = 5000): void {
        setTimeout(async () => {
            const ordersNotInNewState: BinanceOrder[] = await this.ordersCheck();
            if (ordersNotInNewState?.length > 0) {
                // TODO: find out why it the store is not updated
                logger.info(`Orders changed state from ${BinanceOrderStatusEnum.NEW}: ${ordersNotInNewState.length}`)
            }
            this.ordersCheckLoop();
        }, timeout);
    }

    // public placeSellOrder(baseCurrencyTicker: CurrencyTickerEnum, baseAmout: number, sellCurrencyTicker: CurrencyTickerEnum): string {
    //
    // }
    //

    // public calculateProfit(): number {
    //
    // }

}



