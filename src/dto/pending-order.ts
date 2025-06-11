// Internal.
import { PendingOrder as IPendingOrder } from '@/@types';

export class PendingOrder {
    public symbol: string;

    public orderId: string;

    public clientOrderId: string;

    constructor(order: IPendingOrder) {
        this.symbol = order.symbol;
        this.orderId = order.orderId.toString();
        this.clientOrderId = order.clientOrderId;
    }
}
