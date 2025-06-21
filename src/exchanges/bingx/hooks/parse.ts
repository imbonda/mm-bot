/**
 * When converting original resp(string) to json, order id is a big-int in some response
 * it may have big-int issue, will be transformed automatically.
 *
 * For example:
 * order id: 172998235239792314304 is transformed automatically to-->172998235239792314300
 *
 * So instead we convert it to string.
 */
export function transformResponse(res: string): string {
    if (res.includes('"orderId"')) {
        // Replace large orderId numbers with quoted strings.
        res = res.replace(/"orderId":\s*(\d{16,})/g, '"orderId":"$1"');
    }
    return res;
}
