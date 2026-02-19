import { z } from 'zod';
import { customAlphabet } from "nanoid"
import { FastifyBaseLogger } from 'fastify';
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_LENGTH = 21

const nanoid = customAlphabet(ALPHABET, ID_LENGTH)

export const apId = () => nanoid()

export const apProjectId = () => `proj_${nanoid()}`

export const apOrganizationId = () => `org_${nanoid()}`

export const apSessionId = () => `s_${nanoid()}`

export const apAgentId = () => `agt_${nanoid()}`

export const apWebhookId = () => `w_${nanoid()}`

export const BaseModelSchema = z.object({
    id: z.string(),
    created: z.coerce.date(),
    updated: z.coerce.date()
});


export const BaseModelEntityColumns = {
    id: {
        type: String,
        primary: true,
    },
    created: {
        type: Date,
        createDate: true
    },
    updated: {
        type: Date,
        updateDate: true
    }
}

export const JSONB_COLUMN_TYPE = 'jsonb'

export enum OktaManErrorCode {
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    AUTHENTICATION = 'AUTHENTICATION',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export type BaseErrorParams<T, V> = {
    code: T
    params: V
}

export class OktaManError extends Error {
    constructor(
        public error: OktaManErrorParams
    ) {
        super(error.code)
        this.name = 'OktaManError';
    }
}

export type OktaManErrorParams = EntityNotFoundErrorParams | AuthenticationParams | ConfigurationErrorParams

export type EntityNotFoundErrorParams = BaseErrorParams<
    OktaManErrorCode.ENTITY_NOT_FOUND,
    {
        message?: string
        entityType?: string
        entityId?: string
    }
>

export type AuthenticationParams = BaseErrorParams<
    OktaManErrorCode.AUTHENTICATION,
    {
        message: string
    }
>

export type ConfigurationErrorParams = BaseErrorParams<
    OktaManErrorCode.CONFIGURATION_ERROR,
    {
        message: string
    }
>

export function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

export const spreadIfDefined = <T>(key: string, value: T | undefined | null): Record<string, T> => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value,
    }
}

export function rejectedPromiseHandler(promise: Promise<any>, log?: FastifyBaseLogger): void {
    promise.catch(error => {
        console.error('Unhandled promise rejection:', error);
    });
}

export enum PrincipalType {
    USER = 'USER',
    EVERYONE = 'EVERYONE'
}

export type Principal = {
    id: string
    type: PrincipalType
}


export function isString(str: unknown): str is string {
    return str != null && typeof str === 'string'
}

