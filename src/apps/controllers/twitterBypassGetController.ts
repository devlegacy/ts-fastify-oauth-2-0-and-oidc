import type {
  FastifyInstance,
  FastifyRequest,
} from 'fastify'

import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    `/twitter/bypass`,
    async function handler(req: FastifyRequest<{ Querystring: { url: string } }>) {
      const url = req.query.url || `${config.get('twitter.apiUrl')}/users/me?user.fields=profile_image_url`

      const meRequest = await fetch(url, {
        headers: {
          Authorization: `Bearer ${req.cookies.access_token}`,
          // 'Content-Type': 'application/json',
        },
      })
      const {
        data: me,
      } = await meRequest.json() as { data: { id: string } }

      // free tier doesn't allow to get tweets
      // const tweetsRequest = await fetch(`${config.get('twitter.apiUrl')}/users/${me.id}/tweets`, {
      //   headers: {
      //     Authorization: `Bearer ${req.cookies.access_token}`,
      //     // 'Content-Type': 'application/json',
      //   },
      // })
      // const tweets = await tweetsRequest.json()

      return {
        me,
        // tweets,
      }
    },
  )
}
