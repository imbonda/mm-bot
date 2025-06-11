// Internal.
import { exchangeConfig, tradingConfig } from '@/config';
import { BingXClient } from '@/exchanges/bingx/client';
import { BybitClient } from '@/exchanges/bybit/client';
import { Service } from '@/services/service';

export class SpreadMarketMaker extends Service {
    private bybit: BybitClient;

    private bingx: BingXClient;

    constructor() {
        super();
        this.bybit = new BybitClient({
            apiKey: exchangeConfig.bybit.API_KEY,
            apiSecret: exchangeConfig.bybit.API_SECRET,
            apiTimeout: exchangeConfig.bybit.API_TIMEOUT_MS,
        });
        this.bingx = new BingXClient({
            apiKey: exchangeConfig.bingx.API_KEY,
            apiSecret: exchangeConfig.bingx.API_SECRET,
            apiTimeout: exchangeConfig.bingx.API_TIMEOUT_MS,
        });
    }

    public async start(): Promise<void> {
        // TODO
    }
}
