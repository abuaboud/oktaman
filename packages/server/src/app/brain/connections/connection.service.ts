
import { Connection } from '@oktaman/shared';
import { getComposio } from '../../agent/composio/composio.service';

export const connectionService = {
  async list(): Promise<Connection[]> {
    const entityId = 'default-user';
    const composio = await getComposio();

    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [entityId],
      statuses: ['ACTIVE', "INACTIVE"],
    });

    const toolkitSlugs = new Set<string>();

    for (const account of connectedAccounts.items) {
      if (account.toolkit?.slug) {
        toolkitSlugs.add(account.toolkit.slug);
      }
    }

    if (toolkitSlugs.size === 0) {
      return [];
    }

    const session = await composio.create(entityId);
    const allToolkits = await session.toolkits();

    const connectedConnections: Connection[] = allToolkits.items.filter(
      toolkit => toolkitSlugs.has(toolkit.slug)
    ).map(toolkit => ({
      slug: toolkit.slug,
      name: toolkit.name,
      logo: toolkit.logo,
    }));

    return connectedConnections;
  },

  async delete(slug: string): Promise<void> {
    const entityId = 'default-user';
    const composio = await getComposio();

    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [entityId],
    });

    const account = connectedAccounts.items.find(
      (acc) => acc.toolkit?.slug === slug
    );

    if (account) {
      await composio.connectedAccounts.delete(account.id);
    }
  },
};