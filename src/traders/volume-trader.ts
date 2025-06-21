// Internal.
import { tradingConfig } from '@/config';
import { OrderBook } from '@/dto';
import { OrderSide, OrderType } from '@/dto/order';
import { exchange } from '@/lib/exchanges';
import { getRandomInRange } from '@/lib/utils/utils';
import { Trader } from '@/traders/trader';

export class VolumeTrader extends Trader {
    private symbol: string;

    private orderBookDepth: number;

    private amountDecimals: number;

    private priceDecimals: number;

    private minTradeAmount: number;

    private maxTradeAmount: number;

    private priceMarginLower: number;

    private priceMarginUpper: number;

    constructor() {
        super();
        this.symbol = tradingConfig.SYMBOL;
        this.orderBookDepth = tradingConfig.ORDER_BOOK_DEPTH;
        this.amountDecimals = tradingConfig.AMOUNT_DECIMALS;
        this.priceDecimals = tradingConfig.PRICE_DECIMALS;
        this.minTradeAmount = tradingConfig.VOLUME_MIN_AMOUNT;
        this.maxTradeAmount = tradingConfig.VOLUME_MAX_AMOUNT;
        this.priceMarginLower = tradingConfig.VOLUME_PRICE_LOWER;
        this.priceMarginUpper = tradingConfig.VOLUME_PRICE_UPPER;
    }

    public async addVolume(): Promise<void> {
        const orderBook = await exchange.getOrderBook(this.symbol, this.orderBookDepth);
        await this._addVolume(orderBook);
    }

    private async _addVolume(
        orderBook: OrderBook,
    ): Promise<void> {
        this.logger.info('starting to add volume');

        const [askPrice] = orderBook.bestAsk;
        const [bidPrice] = orderBook.bestBid;
        const lowerPrice = bidPrice + (askPrice - bidPrice) * this.priceMarginLower;
        const upperPrice = bidPrice + (askPrice - bidPrice) * this.priceMarginUpper;
        const orderPrice = getRandomInRange(lowerPrice, upperPrice);
        const price = orderPrice.toFixed(this.priceDecimals);
        const orderAmount = getRandomInRange(this.minTradeAmount, this.maxTradeAmount);
        const amount = orderAmount.toFixed(this.amountDecimals);
        exchange.placeMultipleOrders([
            {
                symbol: this.symbol,
                price,
                amount,
                side: OrderSide.ASK,
                type: OrderType.LIMIT,
            },
            {
                symbol: this.symbol,
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
