// Internal.
import { Logger } from '@/lib/logger';

export class Trader {
    protected logger: Logger;

    constructor() {
        this.logger = new Logger(this.constructor.name);
    }
}
