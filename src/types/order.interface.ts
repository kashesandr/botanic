import {CurrencyPairTickerEnum} from "../constants/currency-ticker.enum.js";

export interface NewOrderComplete {
    symbol: CurrencyPairTickerEnum;
    orderId: number;
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: string;
    timeInForce: string;
    type: string;
    side: string;
    workingTime: number;
    fills: any[]; // define correct interface
    selfTradePreventionMode: string;
}
