import { Composio } from "@composio/core";
import { AgentStatus } from "@oktaman/shared";
import { settingsService } from "../../settings/settings.service";

let composioInstance: Composio | null = null;
let composioApiKey: string | undefined = undefined;

async function getComposioClient(): Promise<Composio> {
    if (!composioApiKey) {
        composioApiKey = await settingsService.getEffectiveApiKey('composio');
    }

    if (!composioApiKey) {
        throw new Error('Composio API key not configured. Please configure it in Settings.');
    }

    if (!composioInstance) {
        composioInstance = new Composio({ apiKey: composioApiKey });
    }
    return composioInstance;
}

// Export a function that returns the Composio client
export const getComposio = getComposioClient;

export const composioService = {
    updateTriggerStatus: async (webhookId: string, status: AgentStatus): Promise<void> => {
        const client = await getComposioClient();
        if (status === AgentStatus.ENABLED) {
            await client.triggers.enable(webhookId);
        } else {
            await client.triggers.disable(webhookId);
        }
    },
    deleteTrigger: async (triggerId: string): Promise<void> => {
        const client = await getComposioClient();
        await client.triggers.delete(triggerId);
    },
    getTriggerSchema: async (triggerSlug: string): Promise<unknown> => {
        const client = await getComposioClient();
        const triggerType = await client.triggers.getType(triggerSlug);
        if (!triggerType) {
            throw new Error(`Trigger "${triggerSlug}" not found.`);
        }
        return triggerType;
    },
}