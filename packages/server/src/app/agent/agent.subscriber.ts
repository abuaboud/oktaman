import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { Agent, tryCatch } from "@oktaman/shared";
import { websocketService } from "../core/websockets";
import { logger } from "../common/logger";

@EventSubscriber()
export class AgentSubscriber implements EntitySubscriberInterface<Agent> {
    listenTo() {
        return 'agent';
    }

    async afterInsert(event: InsertEvent<Agent>): Promise<void> {
        const agent = event.entity;
        if (!agent) {
            return;
        }

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'agents',
                'insert',
                agent
            )
        );
        if (error) {
            logger.error({ error, agentId: agent.id }, 'Failed to emit agent insert');
        }
    }

    async afterUpdate(event: UpdateEvent<Agent>): Promise<void> {
        const agent = event.entity as Agent;
        if (!agent) {
            return;
        }

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'agents',
                'update',
                agent
            )
        );
        if (error) {
            logger.error({ error, agentId: agent.id }, 'Failed to emit agent update');
        }
    }

    async afterRemove(event: RemoveEvent<Agent>): Promise<void> {
        const agent = event.entity;
        if (!agent) {
            return;
        }

        const [error] = await tryCatch(
            websocketService.emitCollectionUpdate(
                'agents',
                'delete',
                undefined
            )
        );
        if (error) {
            logger.error({ error, agentId: agent.id }, 'Failed to emit agent delete');
        }
    }
}
