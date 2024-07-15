import {
  existsSync,
  readFileSync,
} from 'node:fs'

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify'

import {
  isNil,
} from '#@/src/Contexts/Shared/domain/shared.utils.js'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/status',
    async function handler(req: FastifyRequest, _res: FastifyReply) {
      eval(
        JSON.parse(
          JSON.stringify({
            url: req.url,
          }),
        ),
      )

      let file = 'file.txt'
      if (existsSync(file)) {
        file = readFileSync(file, 'utf8')
      }
      const ensureValue = isNil(undefined)
      return ensureValue ? {} : {}
    },
  )
}
