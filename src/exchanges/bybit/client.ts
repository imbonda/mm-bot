// 3rd party.
import { APIResponseV3WithTime, RestClientV5 } from 'bybit-api';
// Internal.
import type { ClientOptions } from '@/@types';
import { Ticker } from '@/dto';
import { Logger } from '@/lib/logger';
import { withTimeout } from '@/lib/utils/utils';

export class BybitClient {
    private static BASE_API_URL = 'https://market.biconomy.vip';

    private client: RestClientV5;

    private timeout: number;

    private logger: Logger;

    constructor(options: ClientOptions) {
        this.client = new RestClientV5(
            { key: options.apiKey, secret: options.apiSecret },
            { baseURL: BybitClient.BASE_API_URL },
        );
        this.timeout = options.apiTimeout;
        this.logger = new Logger(this.constructor.name);
    }

    public async getLastTicker(symbol: string): Promise<Ticker> {
        const res = await withTimeout(
            this.client.getTickers({
                category: 'spot',
                symbol,
            }),
            this.timeout,
        );
        this.validate(res);
        const tickers = res.result.list;
        if (!tickers?.length) {
            throw new Error('No tickers found');
        }
        const [lastTicker] = tickers;
        return new Ticker({
            symbol,
            lastPrice: lastTicker.lastPrice,
            bestAsk: lastTicker.ask1Price,
            bestBid: lastTicker.bid1Price,
        });
    }

    // eslint-disable-next-line class-methods-use-this
    private validate<T>(res: APIResponseV3WithTime<T>): void {
        if (res.retCode !== 0) {
            throw new Error(`Bybit request failed: ${res.retMsg}`);
        }
    }
}
