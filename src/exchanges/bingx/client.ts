// 3rd party
import axios, { AxiosRequestConfig } from 'axios';
// Internal.
import type {
    ClientOptions, Credentials, Order,
} from '@/@types';
import {
    AccountBalance, OrderBook, PendingOrder, Ticker,
} from '@/dto';
import { throttle } from '@/lib/decorators';
import { ContentType, HTTPHeaders, HTTPMethod } from '@/lib/http';
import { Logger } from '@/lib/logger';
import { createUUID, encodeURLParams, withTimeout } from '@/lib/utils/utils';
import { authenticate } from '@/exchanges/bingx/hooks/auth';
import { encodeData } from '@/exchanges/bingx/hooks/encode';

interface APIResponse {
    code: number;
    timestamp: number;
    msg?: string;
}

interface APIResponseWithData<T> extends APIResponse {
    data: T;
}

interface RawAccountBalance {
    balances: {
        asset: string;
        disPlayName: string;
        free: string;
        locked: string;
    }[];
}

interface RawOrderBook {
    asks: [string, string][];
    bids: [string, string][];
    lastUpdateId: string;
    ts: number;
}

interface RawBookTicker {
    symbol: string;
    askPrice: string;
    askVolume: string;
    bidPrice: string;
    bidVolume: string;
    eventType: string;
    time: number;
}

interface RawPriceTicker {
    tradeId: string;
    type: number;
    amount: string;
    price: string;
    volume: string;
}

interface RawPendingOrder {
    symbol: string;
    orderId: string;
    clientOrderID: string;
    type: string;
    origQty: string;
    executedQty: string;
    price: string;
    side: string;
    status: string;
    time: number;
}

interface RawPendingOrders {
    orders: RawPendingOrder[];
}

enum Path {
    //
    //  GET
    //
    ACCOUNT_BALANCE = '/account/balance',
    ORDER_BOOK = '/market/depth',
    OPEN_ORDERS = '/trade/openOrders',
    BOOK_TICKER = '/ticker/bookTicker',
    PRICE_TICKER = '/ticker/price',
    //
    // POST
    //
    ORDER = '/trade/order',
    BATCH_ORDERS = '/trade/batchOrders',
    CANCEL_ORDER = '/trade/cancel',
    BATCH_CANCEL_ORDERS = '/trade/cancelOrders',
    CANCEL_ALL_ORDERS = '/trade/cancelOpenOrders'
}

export class BingXClient {
    private static API_BASE_URL = 'https://open-api.bingx.com';

    private static API_V1_URL = `${BingXClient.API_BASE_URL}/openApi/spot/v1`;

    private static RATE_LIMIT_REQ_PER_TIMEFRAME = 100;

    private static RATE_LIMIT_TIMEFRAME_MS = 10_000;

    private creds: Credentials;

    private timeout: number;

    private logger: Logger;

    constructor({ apiTimeout, apiKey, apiSecret }: ClientOptions) {
        this.timeout = apiTimeout;
        this.creds = { apiKey, apiSecret };
        this.logger = new Logger(this.constructor.name);
    }

    // eslint-disable-next-line class-methods-use-this
    public parseSymbol(symbol: string): { base: string; quote: string;} {
        const [base, quote] = symbol.split('-');
        return { base, quote };
    }

    public async getAccountBalance(): Promise<AccountBalance> {
        const path = Path.ACCOUNT_BALANCE;
        const res = await this.send<RawAccountBalance>(HTTPMethod.GET, path, null, true);
        return new AccountBalance(res.data);
    }

    public async getOrderBook(symbol: string, depth: number): Promise<OrderBook> {
        const res = await this.send<RawOrderBook>(
            HTTPMethod.GET,
            Path.ORDER_BOOK,
            encodeData({ symbol, limit: depth }),
        );
        return new OrderBook({
            symbol,
            asks: res?.data?.asks ?? [],
            bids: res?.data?.bids ?? [],
        });
    }

    public async getOpenOrders(symbol: string): Promise<PendingOrder[]> {
        const res = await this.send<RawPendingOrders>(
            HTTPMethod.GET,
            Path.OPEN_ORDERS,
            encodeData({ symbol }),
            true,
        );
        const orders = res.data?.orders ?? [];
        return orders.map((order) => new PendingOrder({
            ...order,
            clientOrderId: order.clientOrderID,
            origAmount: order.origQty,
            filledAmount: order.executedQty,
        }));
    }

    public async getLastTicker(symbol: string): Promise<Ticker> {
        const [bookTicker, priceTicker] = await Promise.all([
            this.getLastOrderBookTicker(symbol),
            this.getLastPriceTicker(symbol),

        ]);
        return new Ticker({
            symbol,
            lastPrice: priceTicker.price,
            bestAsk: bookTicker.askPrice,
            bestBid: bookTicker.bidPrice,
        });
    }

    public async placeOrder(order: Order): Promise<PendingOrder> {
        const path = Path.ORDER;
        const res = await this.send<RawPendingOrder>(
            HTTPMethod.POST,
            path,
            encodeURLParams({
                type: order.type,
                symbol: order.symbol,
                side: order.side,
                quantity: order.amount,
                price: order.price,
                newClientOrderId: createUUID(),
                timeInForce: 'GTC',
            }),
        );
        return new PendingOrder({
            ...res.data,
            clientOrderId: res.data.clientOrderID,
            origAmount: res.data.origQty,
            filledAmount: res.data.executedQty,
        });
    }

    public async placeMultipleOrders(
        orders: Order[],
        batch: boolean = false,
    ): Promise<PendingOrder[]> {
        if (orders.length === 1) {
            const pendinOrder = await this.placeOrder(orders[0]);
            return [pendinOrder];
        }
        if (!batch) {
            const settled = await Promise.allSettled<PendingOrder>(
                orders.map(this.placeOrder.bind(this)),
            );
            const pendinOrders: PendingOrder[] = [];
            const failed: Order[] = [];
            settled.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    pendinOrders.push(result.value);
                } else {
                    failed.push(orders[index]);
                }
            });
            return pendinOrders;
        }
        const path = Path.BATCH_ORDERS;
        const res = await this.send<RawPendingOrders>(
            HTTPMethod.POST,
            path,
            encodeURLParams({
                data: JSON.stringify(
                    orders.map((order) => ({
                        type: order.type,
                        symbol: order.symbol,
                        side: order.side,
                        quantity: order.amount,
                        price: order.price,
                        newClientOrderId: createUUID(),
                    })),
                ),
            }),
        );
        const pending = res.data?.orders ?? [];
        return pending.map((order) => new PendingOrder({
            ...order,
            clientOrderId: order.clientOrderID,
            origAmount: order.origQty,
            filledAmount: order.executedQty,
        }));
    }

    public async cancelOrder(order: PendingOrder): Promise<void> {
        const path = Path.CANCEL_ORDER;
        await this.send(
            HTTPMethod.POST,
            path,
            encodeURLParams({
                symbol: order.symbol,
                orderId: order.orderId,
            }),
        );
    }

    public async cancelMultipleOrders(
        orders: PendingOrder[],
        batch: boolean = false,
    ): Promise<void> {
        if (orders.length === 1) {
            await this.cancelOrder(orders[0]);
            return;
        }
        if (!batch) {
            const settled = await Promise.allSettled(
                orders.map(this.cancelOrder.bind(this)),
            );
            const failed: PendingOrder[] = [];
            settled.forEach((result, index) => {
                if (result.status === 'rejected') {
                    failed.push(orders[index]);
                }
            });
            return;
        }
        const path = Path.BATCH_CANCEL_ORDERS;
        await this.send(
            HTTPMethod.POST,
            path,
            encodeURLParams({
                symbol: orders[0].symbol,
                orderIds: orders.map((order) => order.orderId).join(','),
            }),
        );
    }

    public async canceAllOrders(symbol: string): Promise<void> {
        const path = Path.CANCEL_ALL_ORDERS;
        await this.send(
            HTTPMethod.POST,
            path,
            encodeURLParams({ symbol }),
        );
    }

    //
    // Helper functions.
    //

    private async getLastOrderBookTicker(symbol: string): Promise<RawBookTicker> {
        const res = await this.send<RawBookTicker[]>(
            HTTPMethod.GET,
            Path.BOOK_TICKER,
            encodeData({ symbol }),
        );
        const data = res.data ?? [];
        const [lastTicker] = data ?? [];
        return lastTicker;
    }

    private async getLastPriceTicker(symbol: string): Promise<RawPriceTicker> {
        const res = await this.send<{
            symbol: string;
            trades: RawPriceTicker[];
        }[]>(
            HTTPMethod.GET,
            Path.PRICE_TICKER,
            encodeData({ symbol }),
        );
        const data = res.data ?? [];
        const [symbolTickers] = data;
        const [lastTicker] = symbolTickers?.trades ?? [];
        return lastTicker;
    }

    @throttle({
        // eslint-disable-next-line no-use-before-define
        maxInTimeFrame: BingXClient.RATE_LIMIT_REQ_PER_TIMEFRAME,
        // eslint-disable-next-line no-use-before-define
        timeFrameMs: BingXClient.RATE_LIMIT_TIMEFRAME_MS,
    })
    private async send<T>(
        method: HTTPMethod,
        path: string,
        params?: BodyInit,
        forceAuth?: boolean,
    ): Promise<APIResponseWithData<T>> {
        const { url, reqInit } = authenticate(
            `${BingXClient.API_V1_URL}${path}`,
            {
                method,
                headers: {
                    [HTTPHeaders.CONTENT_TYPE]: ContentType.APPLICATION_JSON,
                },
                body: params,
            },
            this.creds,
            forceAuth,
        );
        const request = axios({
            url,
            ...reqInit,

            /**
             * @important Fixing "orderId" precission issue.
             */
            transformResponse: (res) => {
                if (res.includes('"orderId"')) {
                    // Replace large orderId numbers with quoted strings
                    res = res.replace(/"orderId":\s*(\d{16,})/g, '"orderId":"$1"');
                }
                return res;
            },
        } as AxiosRequestConfig);
        const res = await withTimeout(request, this.timeout);
        this.logger.debug('Response headers', { path, headers: res.headers });
        const json = JSON.parse(res.data);
        this.validate(json);
        return json as APIResponseWithData<T>;
    }

    // eslint-disable-next-line class-methods-use-this
    private validate(res: APIResponse): void {
        if (res.code !== 0) {
            throw new Error(`BingX request failed: ${res.msg}`);
        }
    }
}
