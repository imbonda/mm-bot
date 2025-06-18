interface ParsedSymbol {
    base: string;
    quote: string;
}

export function parseSymbol(symbol: string): ParsedSymbol {
    const [base, quote] = symbol.split('-');
    return { base, quote };
}
