import { rm } from 'fs/promises';

export const fileUtils = {
    rmIfExists: async (path: string) => {
        try {
            await rm(path, { recursive: true, force: true });
        } catch (error) {
            // Ignore if path doesn't exist
        }
    }
};
