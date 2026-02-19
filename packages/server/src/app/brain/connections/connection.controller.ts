import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { connectionService } from "./connection.service";
import { z } from "zod";

export const connectionController: FastifyPluginAsyncZod = async (app) => {
  app.get('/', ListConnectionsConfig, async () => {
    const connections = await connectionService.list();
    return connections;
  });

  app.delete('/:slug', DeleteConnectionConfig, async (request) => {
    await connectionService.delete(
      request.params.slug
    );
    return { success: true };
  });
};

const ListConnectionsConfig = {
  schema: {
    querystring: z.object({}),
  },
};

const DeleteConnectionConfig = {
  schema: {
    params: z.object({
      slug: z.string(),
    }),
  },
};
