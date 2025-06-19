// Internal.
import { Order } from '@/@types';
import { tradingConfig } from '@/config';
import { AccountBalance, PendingOrder, Ticker } from '@/dto';
import { OrderSide, OrderType } from '@/dto/order';
import { bingx, bybit } from '@/lib/exchanges';
import { getRandomInRange, randomSplit } from '@/lib/utils/utils';
import { Trader } from '@/traders/trader';

export class SpreadTrader extends Trader {
    private bybitPairSymbol: string;

    private bingxPairSymbol: string;

    private orderBookDepth: number;

    private lowEndSpread: number;

    private highEndSpread: number;

    private minBaseAssetTradeAmount: number;

    private minQuoteAssetTradeAmount: number;

    private baseAssetBudgetRatio: number;

    private quoteAssetBudgetRatio: number;

    constructor() {
        super();
        this.bybitPairSymbol = tradingConfig.ORACLE_SYMBOL;
        this.bingxPairSymbol = tradingConfig.SYMBOL;
        this.orderBookDepth = tradingConfig.ORDER_BOOK_DEPTH;
        this.lowEndSpread = tradingConfig.LOW_END_SPREAD;
        this.highEndSpread = tradingConfig.HIGH_END_SPREAD;
        this.minBaseAssetTradeAmount = tradingConfig.MIN_BASE_ASSET_AMOUNT;
        this.minQuoteAssetTradeAmount = tradingConfig.MIN_QUOTE_ASSET_AMOUNT;
        this.baseAssetBudgetRatio = tradingConfig.BASE_ASSET_BUDGET_RATIO;
        this.quoteAssetBudgetRatio = tradingConfig.QUOTE_ASSET_BUDGET_RATIO;
    }

    public async fixSpread(): Promise<void> {
        const [
            oracleTicker,
            openOrders,
            accountBalance,
        ] = await Promise.all([
            bybit.getLastTicker(this.bybitPairSymbol),
            bingx.getOpenOrders(this.bingxPairSymbol),
            bingx.getAccountBalance(),
        ]);

        await this._fixSpread(oracleTicker, openOrders, accountBalance);
    }

    private async _fixSpread(
        oracleTicker: Ticker,
        openOrders: PendingOrder[],
        accountBalance: AccountBalance,
    ): Promise<void> {
        this.logger.info('starting to fix spread');
        this.logger.info('Account balance', accountBalance.balances);

        const { base, quote } = bingx.parseSymbol(this.bingxPairSymbol);
        const openAsks = openOrders.filter((order) => order.side === OrderSide.ASK);
        const openBids = openOrders.filter((order) => order.side === OrderSide.BID);
        const baseAssetBalance = accountBalance.getBalance(base)?.free ?? 0;
        const quoteAssetBalance = accountBalance.getBalance(quote)?.free ?? 0;
        const baseAssetBudget = baseAssetBalance * this.baseAssetBudgetRatio;
        const quoteAssetBudget = quoteAssetBalance * this.quoteAssetBudgetRatio;
        const targetPrice = oracleTicker.lastPrice;
        const {
            newOrders: newAskOrders,
            removeOrders: removeAskOrders,
        } = this.getOrderBookFixes(
            targetPrice,
            baseAssetBudget,
            this.minBaseAssetTradeAmount,
            OrderSide.ASK,
            openAsks,
        );
        const {
            newOrders: newBidOrders,
            removeOrders: removeBidOrders,
        } = this.getOrderBookFixes(
            targetPrice,
            quoteAssetBudget,
            this.minQuoteAssetTradeAmount,
            OrderSide.BID,
            openBids,
        );

        await Promise.all([
            bingx.cancelMultipleOrders([...removeAskOrders, ...removeBidOrders]),
            bingx.placeMultipleOrders([...newAskOrders, ...newBidOrders]),
        ]);

        this.logger.info('finished to fix spread');
    }

    private getOrderBookFixes(
        targetPrice: number,
        budget: number,
        minAmount: number,
        side: OrderSide,
        orders: PendingOrder[],
    ): { newOrders: Order[]; removeOrders: PendingOrder[] } {
        const removeOrders: Set<PendingOrder> = new Set(orders);

        // Generate prices for new orders.
        const newOrdersPrices: number[] = [];
        const priceRanges = this.generateOrdersPriceRanges(targetPrice, this.orderBookDepth, side);
        priceRanges.forEach((range) => {
            const found: PendingOrder = orders.find((order) => order.isPriceInRange(range));
            if (found) {
                removeOrders.delete(found);
                return;
            }
            const price = getRandomInRange(...range);
            newOrdersPrices.push(price);
        });

        // Generate new orders.
        const newOrders: Order[] = [];
        const newOrdersAmounts = randomSplit(budget, newOrdersPrices.length, minAmount);
        newOrdersAmounts.forEach((amount, index) => {
            const price = newOrdersPrices[index];
            newOrders.push({
                symbol: this.bingxPairSymbol,
                price,
                amount,
                side,
                type: OrderType.LIMIT,
            });
        });

        return { newOrders, removeOrders: [...removeOrders] };
    }

    private generateOrdersPriceRanges(
        basePrice: number,
        numOrders: number,
        side: OrderSide,
    ): [number, number][] {
        const sign: number = (side === OrderSide.ASK) ? 1 : -1;
        const lowEnd = basePrice * (1 + sign * (this.lowEndSpread / 2));
        const highEnd = basePrice * (1 + sign * (this.highEndSpread / 2));
        const rangeSize = Math.abs(highEnd - lowEnd) / numOrders;
        const ranges: [number, number][] = Array.from({ length: numOrders }, (_, i) => {
            const low = lowEnd + sign * rangeSize * i;
            const high = low + sign * rangeSize;
            return [Math.min(low, high), Math.max(low, high)];
        });
        return ranges;
    }
}
