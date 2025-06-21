// Internal.
import { tradingConfig } from '@/config';
import { OrderBook } from '@/dto';
import { OrderSide, OrderType } from '@/dto/order';
import { bingx } from '@/lib/exchanges';
import { getRandomInRange } from '@/lib/utils/utils';
import { Trader } from '@/traders/trader';

export class VolumeTrader extends Trader {
    private bingxPairSymbol: string;

    private orderBookDepth: number;

    private amountDecimals: number;

    private priceDecimals: number;

    private minTradeAmount: number;

    private maxTradeAmount: number;

    constructor() {
        super();
        this.bingxPairSymbol = tradingConfig.SYMBOL;
        this.orderBookDepth = tradingConfig.ORDER_BOOK_DEPTH;
        this.amountDecimals = tradingConfig.AMOUNT_DECIMALS;
        this.priceDecimals = tradingConfig.PRICE_DECIMALS;
        this.minTradeAmount = tradingConfig.VOLUME_MIN_AMOUNT;
        this.maxTradeAmount = tradingConfig.VOLUME_MAX_AMOUNT;
    }

    public async addVolume(): Promise<void> {
        const orderBook = await bingx.getOrderBook(this.bingxPairSymbol, this.orderBookDepth),;
        await this._addVolume(orderBook);
    }

    private async _addVolume(
        orderBook: OrderBook,
    ): Promise<void> {
        this.logger.info('starting to add volume');

        const [askPrice] = orderBook.bestAsk;
        const [bidPrice] = orderBook.bestBid;
        const orderPrice = (askPrice + bidPrice) / 2;
        const price = orderPrice.toFixed(this.priceDecimals);
        const orderAmount = getRandomInRange(this.minTradeAmount, this.maxTradeAmount);
        const amount = orderAmount.toFixed(this.amountDecimals);
        bingx.placeMultipleOrders([
            {
                symbol: this.bingxPairSymbol,
                price,
                amount,
                side: OrderSide.ASK,
                type: OrderType.LIMIT,
            },
            {
                symbol: this.bingxPairSymbol,
                price,
                amount,
                side: OrderSide.BID,
                type: OrderType.LIMIT,
            },
        ]);

        this.logger.info('Volume order', { amount, price });
        this.logger.info('finished to add volume');
    }
}
