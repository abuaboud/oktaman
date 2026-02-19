import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { sessionController } from "./session.controller";
import { connectionController } from "./connections/connection.controller";
import { channelController } from "./channels/channel.controller";
import { settingsController } from "../settings/settings.controller";

export const oktamanModule: FastifyPluginAsyncZod = async (app) => {

    app.register(sessionController, { prefix: '/v1/sessions' });
    app.register(connectionController, { prefix: '/v1/connections' });
    app.register(channelController, { prefix: '/v1/channels' });
    app.register(settingsController, { prefix: '/v1/settings' });
};
