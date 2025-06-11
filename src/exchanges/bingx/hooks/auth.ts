// Internal.
import type { Credentials } from '@/@types';
import { HTTPMethod } from '@/lib/http';
import { hmac256 } from '@/lib/utils/utils';

interface Request {
    url: string;
    reqInit: RequestInit;
}

export function authenticate(
    url: string,
    reqInit: RequestInit,
    creds: Credentials,
    force?: boolean,
): Request {
    const authReqInit = getAuthRequestInit(reqInit, creds, force);
    if (authReqInit.body) {
        const authUrl = authReqInit.body ? `${url}?${authReqInit.body}` : url;
        delete authReqInit.body;
        return { url: authUrl, reqInit: authReqInit };
    }
    return { url, reqInit: authReqInit };
}

function getAuthRequestInit(
    reqInit: RequestInit,
    creds: Credentials,
    force?: boolean,
): RequestInit {
    if (force) {
        return sign(reqInit, creds);
    }
    switch (reqInit.method?.toUpperCase()) {
        case HTTPMethod.POST:
            return sign(reqInit, creds);
        default:
            return reqInit;
    }
}

function sign(reqInit: RequestInit, creds: Credentials): RequestInit {
    const formData = new URLSearchParams(reqInit.body?.toString());
    const timestamp = Date.now().toString();
    formData.set('timestamp', timestamp);

    const sortedQuery = getSortedQueryString(formData);
    const signature = generateSignature(sortedQuery, creds);
    const encodedQuery = getSortedQueryString(formData, true);
    const body = `${encodedQuery}&signature=${signature}`;

    return {
        ...reqInit,
        headers: {
            ...reqInit.headers,
            'X-BX-APIKEY': creds.apiKey,
        },
        body,
    };
}

function getSortedQueryString(formData: URLSearchParams, urlEncode?: boolean): string {
    const sortedKeys = Array.from(formData.keys()).sort();
    const queryString = sortedKeys
        .map((key) => {
            const values = formData
                .getAll(key)
                .map((value) => (urlEncode ? encodeURIComponent(value) : value))
                .join(',');
            const keyvalue = `${key}=${values}`;
            return keyvalue;
        })
        .join('&');
    return queryString;
}

function generateSignature(query: string, creds: Credentials): string {
    return hmac256(query, creds.apiSecret);
}
