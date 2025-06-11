export function encodeData(data: object): string {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            params.set(key, value.join(','));
        } else {
            params.set(key, String(value));
        }
    });
    return params.toString();
}
