/**
 * Go-style error handling for async functions.
 * Returns a tuple of [error, null] on failure or [null, result] on success.
 *
 * @example
 * const [error, user] = await tryCatch(fetchUser(id));
 * if (error) {
 *   // handle error
 *   return;
 * }
 * // use user safely
 */
export async function tryCatch<T>(
    promise: Promise<T>
): Promise<[Error, null] | [null, T]> {
    try {
        const result = await promise;
        return [null, result];
    } catch (error) {
        return [error instanceof Error ? error : new Error(String(error)), null];
    }
}

/**
 * Go-style error handling for sync functions.
 * Returns a tuple of [error, null] on failure or [null, result] on success.
 *
 * @example
 * const [error, parsed] = tryCatchSync(() => JSON.parse(str));
 * if (error) {
 *   // handle error
 *   return;
 * }
 * // use parsed safely
 */
export function tryCatchSync<T>(
    fn: () => T
): [Error, null] | [null, T] {
    try {
        const result = fn();
        return [null, result];
    } catch (error) {
        return [error instanceof Error ? error : new Error(String(error)), null];
    }
}
