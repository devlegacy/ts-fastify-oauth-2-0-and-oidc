import type {
  FastifyInstance,
} from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/public',
    async function handler() {
      return {}
    },
  )
}
