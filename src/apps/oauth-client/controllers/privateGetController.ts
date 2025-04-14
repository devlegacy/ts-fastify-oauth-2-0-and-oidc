import type {
  FastifyInstance,
} from 'fastify'

import {
  accessTokenVerifier,
} from '#@/src/Contexts/Shared/infrastructure/accessTokenVerifier.js'
import {
  getAccessToken,
} from '#@/src/Contexts/Shared/infrastructure/http/getAccessToken.js'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/private',
    async function handler(req) {
      const access_token = getAccessToken(req)
      accessTokenVerifier(access_token)
      return {}
    },
  )
}
