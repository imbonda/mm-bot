// Internal.
import { Logger } from '@/lib/logger';

export enum ServiceState {
    start = 'start',
    stop = 'stop'
}

export abstract class Service {
    protected logger: Logger;

    constructor() {
        this.logger = new Logger(this.constructor.name);
    }

    public async setup(): Promise<void> {
        this.logger.info('Service setup');
        await this.setupHooks();
    }

    public async teardown(): Promise<void> {
        this.logger.info('Service teardown');
        await this.teardownHooks();
    }

    // eslint-disable-next-line class-methods-use-this
    public setupHooks(): Promise<void> { return Promise.resolve(); }

    // eslint-disable-next-line class-methods-use-this
    public teardownHooks(): Promise<void> { return Promise.resolve(); }

    public abstract start(): Promise<void>;
}

export interface ServiceClass {
    new(): Service;
}
