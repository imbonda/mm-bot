export interface AccountBalance {
    balances: {
        asset: string;
        free: string;
        locked: string;
    }[];
}

export interface OrderBook {
    symbol: string;
    asks: [string, string][];
    bids: [string, string][];
}

export interface Ticker {
    symbol: string;
    lastPrice: string;
    bestAsk: string;
    bestBid: string;
}

export type OrderSide = string;

export type OrderType = string;

export type OrderStatus = string;

export interface Order {
    symbol: string;
    price: number;
    amount: number;
    side: OrderSide;
    type: OrderType;
}

export interface PendingOrder {
    symbol: string;
    orderId: string;
    clientOrderId: string;
    side: OrderSide;
    type: OrderType;
    status: OrderStatus;
    price: string;
    origAmount: string;
    filledAmount: string;
    time: number;
}

export interface Credentials {
    apiKey: string;
    apiSecret: string;
}

export interface ClientOptions extends Credentials {
    apiTimeout: number;
}
