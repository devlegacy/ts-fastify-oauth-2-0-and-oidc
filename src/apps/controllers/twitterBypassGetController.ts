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
      const accessToken = req.cookies.access_token || req.cookies.twitter_access_token || ''
      const meRequest = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // 'Content-Type': 'application/json',
        },
      })
      const {
        data: meResource,
      } = await meRequest.json() as { data: { id: string } }

      // free tier doesn't allow to get tweets
      const tweetsRequest = await fetch(`${config.get('twitter.apiUrl')}/users/${meResource.id}/tweets`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // 'Content-Type': 'application/json',
        },
      })
      const tweetResources = await tweetsRequest.json() as { data: { id: string, text: string, edit_history_tweet_ids: string[] }[], meta: { newest_id: string, next_token: string, oldest_id: string, result_count: number } }

      return {
        me: meResource,
        tweets: tweetsRequest.ok ? tweetResources?.data : [],
      }
    },
  )
}
