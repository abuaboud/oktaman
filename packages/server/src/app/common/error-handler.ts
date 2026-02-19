import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { OktaManError, OktaManErrorCode } from '@oktaman/shared'

export const errorHandler = async (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    if (error instanceof OktaManError) {
        const statusCodeMap: Partial<Record<OktaManErrorCode, StatusCodes>> = {
            [OktaManErrorCode.ENTITY_NOT_FOUND]: StatusCodes.NOT_FOUND,
            [OktaManErrorCode.AUTHENTICATION]: StatusCodes.UNAUTHORIZED,
        }
        const statusCode = statusCodeMap[error.error.code] ?? StatusCodes.BAD_REQUEST

        await reply.status(statusCode).send({
            code: error.error.code,
            params: error.error.params,
        })
    }
    else {
        request.log.error('[errorHandler]: ' + JSON.stringify(error))
        await reply
            .status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR)
            .send(error)
    }
}
