function removeInvalidUnicode(value: string): string {
    // Replace broken surrogate pairs with replacement character
    // This regex matches lone surrogates (high or low) that aren't part of valid pairs
    return value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g, '\uFFFD');
}

export const cleanJson = <T>(obj: T): T =>
    JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === 'string' ? removeInvalidUnicode(value) : value
        )
    ) as T;
