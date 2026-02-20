import { randomBytes } from 'crypto';

const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0, O, 1, I)

const activeCodes = new Map<string, PairingCode>();

function generateCode(): string {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
    }
    return code;
}

export const telegramPairing = {
    createCode(channelId: string): PairingCodeResult {
        // Remove any existing code for this channel
        for (const [code, entry] of activeCodes.entries()) {
            if (entry.channelId === channelId) {
                activeCodes.delete(code);
            }
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + EXPIRY_MS);

        activeCodes.set(code, { channelId, expiresAt });

        return { code, expiresAt: expiresAt.toISOString() };
    },

    validateCode(code: string): ValidateCodeResult | null {
        const upper = code.trim().toUpperCase();
        const entry = activeCodes.get(upper);

        if (!entry) {
            return null;
        }

        if (new Date() > entry.expiresAt) {
            activeCodes.delete(upper);
            return null;
        }

        // Consume the code (one-time use)
        activeCodes.delete(upper);
        return { channelId: entry.channelId };
    },
};

type PairingCode = {
    channelId: string;
    expiresAt: Date;
};

type PairingCodeResult = {
    code: string;
    expiresAt: string;
};

type ValidateCodeResult = {
    channelId: string;
};
