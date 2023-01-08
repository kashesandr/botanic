import {CurrencyPairTickerEnum} from "../constants/currency-ticker.enum.js";
import {BinanceOrderStatusEnum} from "../constants/order.enum.js";

export interface BinanceOrder {
    symbol: CurrencyPairTickerEnum;
    orderId: number;
}

export interface BinanceNewOrderComplete extends BinanceOrder {
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: BinanceOrderStatusEnum;
    timeInForce: string;
    type: string;
    side: string;
    workingTime: number;
    fills: any[]; // define correct interface
    selfTradePreventionMode: string;
}

export interface BinanceOrderDetails extends BinanceOrder {
    orderListId: number;
    clientOrderId: string;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: BinanceOrderStatusEnum;
    timeInForce: string;
    type: string;
    side: string;
    stopPrice: string;
    icebergQty: string;
    time: number;
    updateTime: number;
    isWorking: boolean;
    workingTime: number;
    origQuoteOrderQty: string;
    selfTradePreventionMode: string;
}

export interface OrderSubscription {
    symbol: CurrencyPairTickerEnum;
    orderId: number;
}