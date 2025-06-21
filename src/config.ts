// Builtin.
import path from 'path';
// 3rd party.
import dotenv from 'dotenv';

export const nodeEnv = process.env.NODE_ENV?.toLowerCase();

// Load dotenv variables.
const dotEnvFilename = () => {
    switch (nodeEnv) {
        case 'test':
            return '.env.test';
        default:
            return '.env';
    }
};
dotenv.config({ path: path.join(__dirname, '..', dotEnvFilename()) });

/**
 * Log.
 */
export const logConfig = {
    SILENT: process.env.LOGGER_SILENT?.toLowerCase() === 'true',
    LEVEL: process.env.LOGGER_LEVEL?.toLowerCase() || 'debug',
};

/**
 * Exchange.
 */
export const exchangeConfig = {
    EXCHANGE_NAME: process.env.EXCHANGE_NAME,
    ORACLE_EXCHANGE_NAME: process.env.ORACLE_EXCHANGE_NAME,
    bybit: {
        API_KEY: process.env.BYBIT_API_KEY,
        API_SECRET: process.env.BYBIT_API_SECRET,
        API_TIMEOUT_MS: parseInt(process.env.BYBIT_API_TIMEOUT_MS!),
    },
    bingx: {
        API_KEY: process.env.BINGX_API_KEY,
        API_SECRET: process.env.BINGX_API_SECRET,
        API_TIMEOUT_MS: parseInt(process.env.BINGX_API_TIMEOUT_MS!),
    },
};

/**
 * Market maker.
 */
export const tradingConfig = {
    SYMBOL: process.env.SYMBOL,
    ORACLE_SYMBOL: process.env.ORACLE_SYMBOL,
    ORDER_BOOK_DEPTH: parseInt(process.env.ORDER_BOOK_DEPTH!),
    AMOUNT_DECIMALS: parseInt(process.env.AMOUNT_DECIMALS_PRECISION!),
    PRICE_DECIMALS: parseInt(process.env.PRICE_DECIMALS_PRECISION!),
    SPREAD_PRICE_LOW_END: parseFloat(process.env.SPREAD_PRICE_LOW_END_MARGIN!),
    SPREAD_PRICE_HIGH_END: parseFloat(process.env.SPREAD_PRICE_HIGH_END_MARGIN!),
    SPREAD_MIN_BASE_AMOUNT: parseFloat(process.env.SPREAD_MIN_BASE_ASSET_TRADE_AMOUNT!),
    SPREAD_MIN_QUOTE_AMOUNT: parseFloat(process.env.SPREAD_MIN_QUOTE_ASSET_TRADE_AMOUNT!),
    SPREAD_BASE_BUDGET_RATIO: parseFloat(process.env.SPREAD_BASE_ASSET_BUDGET_RATIO!),
    SPREAD_QUOTE_BUDGET_RATIO: parseFloat(process.env.SPREAD_QUOTE_ASSET_BUDGET_RATIO!),
    VOLUME_MIN_AMOUNT: parseInt(process.env.VOLUME_MIN_TRADE_AMOUNT!),
    VOLUME_MAX_AMOUNT: parseInt(process.env.VOLUME_MAX_TRADE_AMOUNT!),
    VOLUME_PRICE_LOWER: parseFloat(process.env.VOLUME_PRICE_MARGIN_LOWER!),
    VOLUME_PRICE_UPPER: parseFloat(process.env.VOLUME_PRICE_MARGIN_UPPER!),
    UPDATE_INTERVAL_MS: parseInt(process.env.UPDATE_INTERVAL_MS!),
};

/**
 * Service identifiers.
 */
export const serviceConfig = {
    APP_NAME: process.env.APP_NAME,
    NAME: process.env.SERVICE_NAME,
};

const REQUIRED_CONFIGS: object[] = [
    /** Add required args. */
    tradingConfig,
];

export function validateConfig() {
    REQUIRED_CONFIGS.forEach(validateSubConfig);
}

function validateSubConfig(subConfig: object) {
    Object.entries(subConfig).forEach(([key, value]) => {
        if (typeof value === 'object') {
            validateSubConfig(value);
        } else if ([undefined, NaN].includes(value)) {
            throw new Error(`Missing configuration for ${key}`);
        }
    });
}
