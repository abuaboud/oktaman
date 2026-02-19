import { SessionLocation, tryCatch } from '@oktaman/shared';
import { logger } from './logger';

export const geolocationService = {
    async getLocationFromIp(ip: string): Promise<SessionLocation | null> {
        const [error, response] = await tryCatch(
            fetch(`http://ip-api.com/json/${ip}?fields=status,message,city,regionName,country,timezone`)
        );

        if (error) {
            logger.error({ error, ip }, '[GeolocationService] Failed to fetch geolocation');
            return null;
        }

        const [parseError, data] = await tryCatch(response.json() as Promise<GeolocationResponse>);

        if (parseError) {
            logger.error({ error: parseError, ip }, '[GeolocationService] Failed to parse geolocation response');
            return null;
        }

        if (data.status !== 'success') {
            logger.warn({ ip, message: data.message }, '[GeolocationService] Geolocation API returned error status');
            return null;
        }

        return {
            city: data.city || null,
            region: data.regionName || null,
            country: data.country || null,
            timezone: data.timezone || null,
        };
    },
};

type GeolocationResponse = {
    status: 'success' | 'fail';
    message?: string;
    city?: string;
    regionName?: string;
    country?: string;
    timezone?: string;
}
