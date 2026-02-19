const locks: Map<string, Promise<void>> = new Map()

export const mutexLock = {
    runExclusive: async <T>(key: string, callback: () => Promise<T>): Promise<T> => {
        // Wait for any existing lock on this key
        while (locks.has(key)) {
            await locks.get(key)
        }

        // Create a new lock
        let releaseLock: () => void
        const lockPromise = new Promise<void>((resolve) => {
            releaseLock = resolve
        })
        locks.set(key, lockPromise)

        try {
            // Execute the callback
            return await callback()
        } finally {
            // Release the lock
            locks.delete(key)
            releaseLock!()
        }
    }
}
