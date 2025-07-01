// Internal.
import { tradingConfig } from '@/config';
import { safe } from '@/lib/decorators';
import { Service } from '@/services/service';
import { SpreadTrader, VolumeTrader } from '@/traders';

export class MarketMaker extends Service {
    private spreadTrader: SpreadTrader;

    private volumeTrader: VolumeTrader;

    private updateIntervalMs: number;

    constructor() {
        super();
        this.spreadTrader = new SpreadTrader();
        this.volumeTrader = new VolumeTrader();
        this.updateIntervalMs = tradingConfig.UPDATE_INTERVAL_MS;
    }

    public async start(): Promise<void> {
        await this.runPeriodically();
    }

    protected async runPeriodically(): Promise<void> {
        await this.run();
        const sleepMs = this.updateIntervalMs;
        this.logger.info('Sleep', { sleepMs });
        setTimeout(this.runPeriodically.bind(this), sleepMs);
    }

    @safe({ silent: false })
    protected async run(): Promise<void> {
        await this.volumeTrader.addVolume();
        await this.spreadTrader.fixSpread();
    }
}
