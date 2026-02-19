import Fastify from 'fastify';
import rawBody from 'fastify-raw-body';
import { app } from './app/app';
import { initializeDatabase } from './app/database/database-connection';
import { HOST, PORT, LOG_LEVEL } from './app/common/system';
import { sessionManager } from './app/core/session-manager/session-manager.service';
import { schedulerService } from './app/agent/scheduler/scheduler.service';
import { telegramChannelHandler } from './app/brain/channels/telegram-channel-handler';

// Instantiate Fastify with some config
const server = Fastify({
  logger: {
    level: LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname,reqId',
        messageFormat: '{if req.method}\x1b[36m[{req.method} {req.url}]\x1b[0m {end}{msg}',
        customColors: 'info:cyan,warn:yellow,error:red,debug:magenta,trace:gray,fatal:bgRed',
        errorLikeObjectKeys: ['err', 'error'],
        singleLine: false,
        hideObject: false,
        levelFirst: false,
        sync: false,
        destination: 1, // stdout
        append: false
      }
    },
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      }
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        remoteAddress: req.socket?.remoteAddress,
        remotePort: req.socket?.remotePort
      }),
      res: (res) => ({
        statusCode: res.statusCode
      })
    }
  },
  bodyLimit: 100 * 1024 * 1024, // 100MB body limit to prevent 413 errors
});

// Register raw body plugin for webhook signature verification
server.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true
});

// Register your application as a normal plugin.
server.register(app);

// Start listening.
const start = async () => {
  try {
    process.env.TZ = 'UTC';
    await initializeDatabase();

    // Initialize session manager and scheduler service
    await sessionManager.initialize();
    await schedulerService.init();

    await server.listen({ port: PORT, host: HOST });

    server.log.info(`🚀 OktaMan server running at http://${HOST}:${PORT}`);

    // Initialize Telegram bots
    await telegramChannelHandler.initializeAllFromDatabase();

    // Graceful shutdown
    const gracefulShutdown = async () => {
      server.log.info('Received shutdown signal, closing gracefully...');
      await sessionManager.shutdown();
      await schedulerService.close();
      await telegramChannelHandler.stopAll();
      await server.close();
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
