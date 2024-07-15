import type {
  FastifyInstance,
} from 'fastify'

import {
  getAccessToken,
} from '#@/src/Contexts/Shared/infrastructure/http/getAccessToken.js'
import {
  verifyAccessToken,
} from '#@/src/Contexts/Shared/infrastructure/verifyAccessToken.js'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/private',
    async function handler(req) {
      const access_token = getAccessToken(req)
      verifyAccessToken(access_token)
      return {}
    },
  )
}
