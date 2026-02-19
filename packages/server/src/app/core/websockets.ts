import { Server } from 'socket.io'
import { AgentStreamingEvent, Agent, SessionMetadata, CollectionOperation } from '@oktaman/shared'
import { logger } from '../common/logger'

let io: Server

export const websocketService = {
    setIo(ioInstance: Server): void {
        io = ioInstance
    },
    getIo(): Server {
        if (!io) {
            throw new Error('Socket.IO instance not initialized')
        }
        return io
    },
    async emitCollectionUpdate(
        collection: 'agents' | 'sessions',
        operation: CollectionOperation,
        entity?: Agent | SessionMetadata,
    ): Promise<void> {
        const ioInstance = this.getIo()

        const payload = {
            event: AgentStreamingEvent.COLLECTION_UPDATE,
            data: {
                collection,
                operation,
                ...(entity && { entity }),
            },
        }

        logger.info({
            collection,
            operation,
        }, '[WebsocketService] Emitting collection update to main-user room')

        ioInstance.to('main-user').emit(payload.event, payload)
    },
}
