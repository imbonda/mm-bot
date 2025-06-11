// Builtin.
import crypto from 'crypto';
// 3rd party.
import { v4 as uuidv4 } from 'uuid';
// Internal.
import { TimeoutError } from '@/lib/errors';

// 3rd party.
export { isEmpty } from 'lodash';

export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
): Promise<T> {
    let timeout: NodeJS.Timeout;
    // Run "evaluate()" and race it against a timeout.
    return Promise.race([
        promise
            .then((val) => {
                clearTimeout(timeout);
                return val;
            })
            .catch((err) => {
                clearTimeout(timeout);
                throw err;
            }),
        new Promise((_, reject) => {
            timeout = setTimeout(
                () => reject(new TimeoutError()),
                timeoutMs,
            );
        }),
    ]) as T;
}

export function hmac256(data: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}

export function encodeURLParams(json: object): URLSearchParams {
    const params = new URLSearchParams();
    Object.entries(json).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            params.set(key, value.join(','));
        } else {
            params.set(key, String(value));
        }
    });
    return params;
}

export function createUUID(length = 32): string {
    return uuidv4()
        .replace(/-/g, '') // Remove dashes.
        .slice(0, length);
}
