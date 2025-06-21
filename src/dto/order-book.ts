// Internal.
import { OrderBook as IOrderBook } from '@/@types';

export class OrderBook {
    public symbol: string;

    public asks: [number, number][];

    public bids: [number, number][];

    public bestAsk?: [number, number];

    public bestBid?: [number, number];

    constructor(orderbook: IOrderBook) {
        this.symbol = orderbook.symbol;
        this.asks = orderbook.asks.map(
            ([price, amount]) => ([parseFloat(price), parseFloat(amount)]),
        );
        this.bids = orderbook.bids.map(
            ([price, amount]) => ([parseFloat(price), parseFloat(amount)]),
        );
        if (this.asks?.length !== 0) {
            this.bestAsk = this.asks[this.asks.length - 1];
        }
        if (this.bids?.length !== 0) {
            [this.bestBid] = this.bids;
        }
    }
}
