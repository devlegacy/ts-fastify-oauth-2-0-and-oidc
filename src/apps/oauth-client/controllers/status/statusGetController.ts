import type {
  FastifyInstance,
} from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/status',
    async function handler() {
      return {}
    },
  )
}
