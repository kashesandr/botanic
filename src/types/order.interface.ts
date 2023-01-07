import {CurrencyPairTickerEnum} from "../constants/currency-ticker.enum.js";
import {BinanceOrderStatusEnum} from "../constants/order.enum.js";

export interface BinanceNewOrderComplete {
    symbol: CurrencyPairTickerEnum;
    orderId: number;
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

export interface BinanceOrder {
    symbol: CurrencyPairTickerEnum;
    orderId: number;
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

