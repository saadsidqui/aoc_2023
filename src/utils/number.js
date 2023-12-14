export const to_int = (val, radix) => {
    const result = parseInt(val, radix ?? 10);
    return (isNaN(result) ? null : result);
}

export const to_float = (val) => {
    const result = parseFloat(val);

    if (isNaN(result) || !isFinite(result))
        return null;

    return result;
}

export const number_format = (n, dp) => {
    const result = to_float(n);
    return (result === null ? n : result.toFixed(dp ?? 2));
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const gcd = (a, b) => {
    if (a < b) {
        let swap = a;
        a = b;
        b = swap;
    }

    let r;
    while ((r = a % b) > 0) {
        a = b;
        b = r;
    }
    return b;
};

export const lcm = (a, b) => ((a | b) === 0) ? 0 : Math.abs(a) * (Math.abs(b)/gcd(a, b));
