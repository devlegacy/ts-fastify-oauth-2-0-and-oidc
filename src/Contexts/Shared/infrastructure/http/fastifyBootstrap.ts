import {
  type AutoloadPluginOptions,
} from '@fastify/autoload'
import type {
  FastifyCorsOptions,
} from '@fastify/cors'
import type {
  FastifyInstance,
} from 'fastify'

export const fastifyBootstrap = (
  fastify: FastifyInstance,
  config: {
    autoload: AutoloadPluginOptions
    cors?: FastifyCorsOptions
  },
) => {
  fastify
    .register(import('@fastify/autoload'), {
      forceESM: true,
      dirNameRoutePrefix: false,
      dir: config.autoload.dir,
      options: {
        prefix: '/api',
      },
      maxDepth: 10,
      matchFilter: (filename) => {
        // performance optimization with includes instead of regex
        return filename.includes('Controller')
      },
    })
    .register(import('@fastify/cors'), config.cors)
    .register(import('@fastify/compress'))
    .register(import('@fastify/cookie'))
}
