import { Spot } from '@binance/connector';
import {CurrencyPairTickerEnum, CurrencyTickerEnum} from "./constants/currency-ticker.enum.js";
import {NewOrderComplete} from "./types/order.interface.js";

export class BinanceBot {

    constructor(private binanceConnectClient: Spot) {

    }

    public async getBalanceByTicker(ticker: CurrencyTickerEnum): Promise<number> {
        try {
            const {data} = await this.binanceConnectClient.userAsset({asset: ticker});
            return Number(data[0]?.free);
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    public async isEnoughBalance(ticker: CurrencyTickerEnum, requiredBalance: number): Promise<boolean> {
        const currentBalance = await this.getBalanceByTicker(ticker);
        return currentBalance >= requiredBalance
    }

    public async getExchangePriceByTicker(exchangePairTicker: CurrencyPairTickerEnum): Promise<number> {
        try {
            const { data } = await this.binanceConnectClient.tickerPrice(exchangePairTicker);
            return data?.price;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // TODO: define interface
    public async placeBuyLimitOrder(exchangePairTicker: CurrencyPairTickerEnum, price: number, quantity: number): Promise<NewOrderComplete> {
        try {
            const {data} = await this.binanceConnectClient.newOrder(exchangePairTicker, 'BUY', 'LIMIT', {
                price: price.toString(),
                quantity,
                timeInForce: 'GTC'
            })
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // public placeSellOrder(baseCurrencyTicker: CurrencyTickerEnum, baseAmout: number, sellCurrencyTicker: CurrencyTickerEnum): string {
    //
    // }
    //
    // public onOrderFulfilled(orderId: string): Promise<any> {
    //
    // }
    //
    // public calculateProfit(): number {
    //
    // }
    //
    // public getOrderStatus() {
    //
    // }

}