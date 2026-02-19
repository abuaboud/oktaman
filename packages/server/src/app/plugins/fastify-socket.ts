import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Server, ServerOptions } from 'socket.io'
import { logger } from '../common/logger' // Import the logger
import { websocketService } from '../core/websockets'

export type FastifySocketioOptions = Partial<ServerOptions> & {
  preClose?: (done: Function) => void
}

const fastifySocketIO: FastifyPluginAsync<FastifySocketioOptions> = fp(
  async function (fastify, opts: FastifySocketioOptions) {
    function defaultPreClose(done: Function) {
      (fastify as any).io.local.disconnectSockets(true)
      done()
    }
    const io = new Server(fastify.server, opts)
    fastify.decorate('io', io)
    websocketService.setIo(io)

    fastify.addHook('preClose', (done) => {
      if (opts.preClose) {
        return opts.preClose(done)
      }
      return defaultPreClose(done)
    })
    fastify.addHook('onClose', (fastify: FastifyInstance, done) => {
      (fastify as any).io.close()
      done()
    })
  },
  { fastify: '>=4.x.x', name: 'fastify-socket.io' },
)

export default fastifySocketIO