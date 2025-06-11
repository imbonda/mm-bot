// Internal.
import { Ticker as ITicker } from '@/@types';

export class Ticker {
    public symbol: string;

    public lastPrice: number;

    public bestAsk: number;

    public bestBid: number;

    constructor(ticker: ITicker) {
        this.symbol = ticker.symbol;
        this.lastPrice = parseFloat(ticker.lastPrice);
        this.bestAsk = parseFloat(ticker.bestAsk);
        this.bestBid = parseFloat(ticker.bestBid);
    }
}
