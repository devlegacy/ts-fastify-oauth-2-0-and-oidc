import type {
  FastifyInstance,
  FastifyRequest,
} from 'fastify'
import {
  request,
} from 'undici'

import {
  config,
} from '#/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'

type MeResource = { id: string, username: string, name: string, profile_image_url?: string }
type TweetResource = { id: string, text: string, edit_history_tweet_ids: string[] }

async function fetchMe(url: string, accessToken: string) {
  const meRequest = await request(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (meRequest.statusCode < 200 || meRequest.statusCode >= 300) {
    return {
      error: await meRequest.body.text(),
      data: null,
    }
  }
  const body = await meRequest.body.json() as {
    data?: MeResource
    errors?: unknown[]
  }
  if (!body.data) {
    return {
      error: body.errors ?? 'Twitter API returned no user data',
      data: null,
    }
  }
  return {
    error: null,
    data: body.data,
  }
}

async function fetchTweets(userId: string, accessToken: string): Promise<TweetResource[]> {
  const tweetsRequest = await request(`${config.get('twitter.apiUrl')}/users/${userId}/tweets`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (tweetsRequest.statusCode < 200 || tweetsRequest.statusCode >= 300) {
    return []
  }
  const body = await tweetsRequest.body.json() as { data?: TweetResource[] }
  return body.data ?? []
}

export default async function (fastify: FastifyInstance) {
  fastify.get(
    `/twitter/bypass`,
    async function handler(req: FastifyRequest<{ Querystring: { url: string } }>) {
      const url = req.query.url || `${config.get('twitter.apiUrl')}/users/me?user.fields=profile_image_url`
      const {
        cookies,
      } = req
      const accessToken = cookies[config.get('twitter.cookie.accessToken')] || cookies.access_token || ''

      const {
        error,
        data: me,
      } = await fetchMe(url, accessToken)
      if (error || !me) {
        return {
          error,
          me: null,
          tweets: [],
        }
      }

      // free tier doesn't allow to get tweets
      const tweets = await fetchTweets(me.id, accessToken)

      return {
        me,
        tweets,
      }
    },
  )
}
