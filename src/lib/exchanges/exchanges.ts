// Internal.
import { exchangeConfig } from '@/config';
import { BingXClient } from '@/exchanges/bingx';
import { BybitClient } from '@/exchanges/bybit';

export { BingXClient, BybitClient };

export const bingx = new BingXClient({
    apiKey: exchangeConfig.bingx.API_KEY,
    apiSecret: exchangeConfig.bingx.API_SECRET,
    apiTimeout: exchangeConfig.bingx.API_TIMEOUT_MS,
});

export const bybit = new BybitClient({
    apiKey: exchangeConfig.bybit.API_KEY,
    apiSecret: exchangeConfig.bybit.API_SECRET,
    apiTimeout: exchangeConfig.bybit.API_TIMEOUT_MS,
});

export const exchange = bingx;
export const oracle = bybit;
