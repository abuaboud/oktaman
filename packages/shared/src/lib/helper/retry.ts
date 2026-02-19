export interface RetryOptions {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a function with exponential backoff retry logic.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function execution
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await apiCall(),
 *   {
 *     maxRetries: 5,
 *     initialDelayMs: 2000,
 *     maxDelayMs: 30000,
 *     shouldRetry: (error) => error.message.includes('Conflict'),
 *     onRetry: (error, attempt, delay) => console.log(`Retry ${attempt} after ${delay}ms`)
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Check if we should retry
            if (config.shouldRetry && !config.shouldRetry(lastError)) {
                throw lastError;
            }

            // Check if we've exhausted all retries
            if (attempt >= config.maxRetries) {
                throw lastError;
            }

            // Calculate exponential backoff delay with jitter
            const baseDelay = Math.min(
                config.initialDelayMs * Math.pow(2, attempt),
                config.maxDelayMs
            );
            const jitter = Math.random() * 1000; // Add up to 1 second jitter
            const delayMs = baseDelay + jitter;

            // Notify about retry
            if (config.onRetry) {
                config.onRetry(lastError, attempt + 1, delayMs);
            }

            await sleep(delayMs);
            attempt++;
        }
    }

    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw lastError || new Error('Failed after all retries');
}
