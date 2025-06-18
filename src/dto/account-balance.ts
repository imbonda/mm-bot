// Internal.
import { AccountBalance as IAccountBalance } from '@/@types';

interface AssetBalance {
    free: number;
    locked: number;
    total: number;
}

export class AccountBalance {
    private _balances: Record<string, AssetBalance>;

    constructor(accountBalance: IAccountBalance) {
        this._balances = {};
        accountBalance.balances?.forEach(({ asset, free, locked }) => {
            const freeBalance = parseFloat(free);
            const lockedBalance = parseFloat(locked);
            const totalBalance = freeBalance + lockedBalance;
            this._balances[asset] = {
                free: freeBalance,
                locked: lockedBalance,
                total: totalBalance,
            };
        });
    }

    public get balances(): Record<string, AssetBalance> {
        return this._balances;
    }

    public getBalance(asset: string): AssetBalance {
        return this._balances[asset];
    }
}
