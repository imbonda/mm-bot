// Internal.
import type { PendingOrder as IPendingOrder } from '@/@types';
import { OrderSide, OrderStatus, OrderType } from '@/dto/order';

export class PendingOrder {
    public orderId: string;

    public clientOrderId: string;

    public symbol: string;

    public side: OrderSide;

    public type: OrderType;

    public status: OrderStatus;

    public price: number;

    public origAmount: number;

    public filledAmount: number;

    public remainingAmount: number;

    public time: number;

    constructor(order: IPendingOrder) {
        this.orderId = order.orderId;
        this.clientOrderId = order.clientOrderId;
        this.symbol = order.symbol;
        this.side = order.side as OrderSide;
        this.type = order.type as OrderType;
        this.status = order.status as OrderStatus;
        this.price = parseFloat(order.price);
        this.origAmount = parseFloat(order.origAmount);
        this.filledAmount = parseFloat(order.filledAmount);
        this.remainingAmount = this.origAmount - this.filledAmount;
        this.time = order.time;
    }

    public isPriceInRange(range: [number, number]): boolean {
        const [start, end] = range;
        return (start <= this.price) && (this.price) <= end;
    }

    public compare(other: this): number {
        return this.price - other.price;
    }
}
