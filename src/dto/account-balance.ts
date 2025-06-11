// Internal.
import { AccountBalance as IAccountBalance } from '@/@types';

interface AssetBalance {
    free: number;
    locked: number;
}

export class AccountBalance {
    private balances: Record<string, AssetBalance>;

    constructor(accountBalance: IAccountBalance) {
        this.balances = {};
        accountBalance.balances?.forEach(({ asset, free, locked }) => {
            this.balances[asset] = {
                free: parseFloat(free),
                locked: parseFloat(locked),
            };
        });
    }

    public getBalance(asset: string): AssetBalance {
        return this.balances[asset];
    }
}
