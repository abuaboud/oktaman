import { FastifyRequest } from 'fastify';

export const ipExtractor = {
    extractIp(request: FastifyRequest): string {
        // Check Cloudflare header first
        const cfConnectingIp = request.headers['cf-connecting-ip'];
        if (cfConnectingIp && typeof cfConnectingIp === 'string') {
            return cfConnectingIp;
        }

        // Check X-Forwarded-For header
        const xForwardedFor = request.headers['x-forwarded-for'];
        if (xForwardedFor && typeof xForwardedFor === 'string') {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(',')[0].trim();
        }

        // Fallback to Fastify's request.ip
        return request.ip;
    },
};
