import { randomBytes } from 'crypto';
import { settingsService } from '../../settings/settings.service';

const EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function generateCode(): string {
    const bytes = randomBytes(3);
    // 6-digit numeric code (e.g. 482937)
    const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 900000 + 100000;
    return num.toString();
}

function isExpired(expiresAt: string): boolean {
    return new Date().toISOString() > expiresAt;
}

export const telegramPairing = {
    async createCode(channelId: string): Promise<PairingCodeResult> {
        const settings = await settingsService.getOrCreate();

        const code = generateCode();
        const expiresAt = new Date(Date.now() + EXPIRY_MS).toISOString();

        settings.pairingCode = { code, channelId, expiresAt };
        await settingsService.save(settings);

        return { code, expiresAt };
    },

    async validateCode(code: string): Promise<ValidateCodeResult | null> {
        const trimmed = code.trim();
        const settings = await settingsService.getOrCreate();

        const entry = settings.pairingCode;
        if (!entry || isExpired(entry.expiresAt) || entry.code !== trimmed) {
            // Clear expired code
            if (entry && isExpired(entry.expiresAt)) {
                settings.pairingCode = null;
                await settingsService.save(settings);
            }
            return null;
        }

        // Consume the code (one-time use)
        settings.pairingCode = null;
        await settingsService.save(settings);

        return { channelId: entry.channelId };
    },
};

type PairingCodeResult = {
    code: string;
    expiresAt: string;
};

type ValidateCodeResult = {
    channelId: string;
};
