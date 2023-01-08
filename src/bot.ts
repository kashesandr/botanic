import {Spot as BinanceSpot} from '@binance/connector';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {BinanceNewOrderComplete, BinanceOrder, BinanceOrderDetails} from "./types/order.interface.js";
import {PubSub} from "./pubsub.js";
import {BinanceOrderStatusEnum} from "./constants/order.enum.js";
import {logger} from './logger.js';

export class BinanceBot {

    pubsub = new PubSub();
    watchedOrders: BinanceOrder[] = [];
    binanceConnectClient: BinanceSpot = null;

    constructor(private apiKey: string, private apiSecret: string, private baseURL: string) {

        if (!apiKey || !apiSecret) {
            // TODO: log debug
            throw new Error('Error creating Binance Bot, API keys not provided')
        }

        this.binanceConnectClient = new BinanceSpot(this.apiKey, this.apiSecret, { baseURL: this.baseURL, logger });
        this.ordersCheckLoop(5000);

    }

    public async getBalanceByTicker(ticker: CurrencyTickerEnum): Promise<number> {
        // TODO: log debug
        try {
            const {data} = await this.binanceConnectClient.userAsset({asset: ticker});
            return Number(data[0]?.free);
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    public async isEnoughBalance(ticker: CurrencyTickerEnum, requiredBalance: number): Promise<boolean> {
        // TODO: log debug
        const currentBalance = await this.getBalanceByTicker(ticker);
        return currentBalance >= requiredBalance
    }

    public async getExchangePriceByTicker(exchangePairTicker: CurrencyPairTickerEnum): Promise<number> {
        // TODO: log debug
        try {
            const { data } = await this.binanceConnectClient.tickerPrice(exchangePairTicker);
            return data?.price;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    public async placeBuyLimitOrder(exchangePairTicker: CurrencyPairTickerEnum, price: number, quantity: number): Promise<BinanceNewOrderComplete> {
        // TODO: log debug
        try {
            const {data} = await this.binanceConnectClient.newOrder(exchangePairTicker, 'BUY', 'LIMIT', {
                price: price.toString(),
                quantity,
                timeInForce: 'GTC'
            })
            return data;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    public async getOrderDetails(ticker: CurrencyPairTickerEnum, orderId: number): Promise<BinanceOrderDetails> {
        // TODO: log debug
        try {
            const { data } = await this.binanceConnectClient.getOrder(ticker, {orderId});
            return data;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    public subscribeOnceOnOrderComplete(order: BinanceOrder, callback: Function) {
        // TODO: log debug
        this.watchedOrders.push(order);
        const key = this.getOrderWatchKey(order);
        this.pubsub.subscribe(key, callback, true);
    }

    /**
     * checks all watched orders and returns filled ones
     * @private
     */
    private async ordersCheck(): Promise<BinanceOrder[]> {
        // TODO: log debug
        const keys = Object.keys(this.pubsub.pubsubStore);
        const promises = keys.map( key => {
            const {symbol, orderId} = this.getSymbolAndIdFromOrderWatchKey(key);
            return this.getOrderDetails(symbol, orderId)
        } )
        const orders = await Promise.all(promises);
        const ordersFilled: BinanceOrder[] = [];
        orders.forEach( order => {
            if (order.status !== BinanceOrderStatusEnum.NEW) {
                ordersFilled.push(order);
                const key = this.getOrderWatchKey(order);
                this.pubsub.publish<BinanceOrderDetails>(key, order);
            }
        });
        return ordersFilled;
    }

    private getOrderWatchKey( order: BinanceOrder ): string {
        return `${order.symbol}-${order.orderId}`;
    }

    private getSymbolAndIdFromOrderWatchKey(key: string): {symbol: CurrencyPairTickerEnum, orderId: number} {
        const [symbol, orderId] = key.split('-');
        return {
            symbol: symbol as CurrencyPairTickerEnum,
            orderId: Number(orderId)
        }
    }

    // TODO: start and stop loop depending on watched orders
    private ordersCheckLoop(timeout = 5000): void {
        // TODO: log debug
        setTimeout(async () => {
            const ordersFilled: BinanceOrder[] = await this.ordersCheck();
            if (ordersFilled.length > 0) {
                // TODO
                // TODO: log debug
            }
            this.ordersCheckLoop();
        }, timeout);
    }

    // TODO: finalize the method
    // public placeSellOrder(baseCurrencyTicker: CurrencyTickerEnum, baseAmout: number, sellCurrencyTicker: CurrencyTickerEnum): string {
    //
    // }
    //

    // public calculateProfit(): number {
    //
    // }

}



