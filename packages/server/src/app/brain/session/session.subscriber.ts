import { EntitySubscriberInterface, EventSubscriber, LoadEvent, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { Session, SessionMetadata, tryCatch } from "@oktaman/shared";
import { websocketService } from "../../core/websockets";
import { logger } from "../../common/logger";

@EventSubscriber()
export class SessionSubscriber implements EntitySubscriberInterface<Session> {
    listenTo() {
        return 'session';
    }

    async afterInsert(event: InsertEvent<Session>): Promise<void> {
        const session = event.entity;
        if (!session) {
            return;
        }

        const { conversation, ...sessionMetadata } = session;

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'sessions',
                'insert',
                sessionMetadata as SessionMetadata
            )
        );
        if (error) {
            logger.error({ error, sessionId: session.id }, 'Failed to emit session insert');
        }
    }

    async afterUpdate(event: UpdateEvent<Session>): Promise<void> {
        const session = event.entity as Session;
        if (!session) {
            return;
        }

        const { conversation, ...sessionMetadata } = session;

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'sessions',
                'update',
                sessionMetadata as SessionMetadata
            )
        );
        if (error) {
            logger.error({ error, sessionId: session.id }, 'Failed to emit session update');
        }
    }

    async afterRemove(event: RemoveEvent<Session>): Promise<void> {
        const session = event.entity;
   
        if (!session) {
            return;
        }

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'sessions',
                'delete',
                undefined
            )
        );
        if (error) {
            logger.error({ error, sessionId: session.id }, 'Failed to emit session delete');
        }
    }
}
