import type {
  FastifyInstance,
} from 'fastify'

import {
  getBasicCredentials,
} from '#@/src/Contexts/Shared/infrastructure/http/getBasicCredentials.js'
import {
  signAccessToken,
} from '#@/src/Contexts/Shared/infrastructure/signAccessToken.js'
import {
  getUser,
} from '#@/src/Contexts/Users/infrastructure/getUser.js'

export default async function (fastify: FastifyInstance) {
  fastify
    .post(
      '/authentication/local/basic',
      async function handler(req) {
        const {
          username,
          password,
        } = getBasicCredentials(req)

        const user = getUser(username, password)
        const accessToken = signAccessToken(user)
        return {
          access_token: accessToken,
        }
      },
    )
    // .get(
    //   '/authentication/spotify',
    //   async function handler(req, res) {
    //     const scopes = [
    //       'user-read-private',
    //       'user-read-email',
    //       'playlist-read-private',
    //     ]
    //     const query = new URLSearchParams({
    //       response_type: 'code',
    //       client_id: process.env?.SPOTIFY_CLIENT_ID ?? '',
    //       scope: scopes.join(' '),
    //       redirect_uri: process.env?.SPOTIFY_REDIRECT_URI ?? '',
    //     })
    //     const redirect = new URL(process.env.SPOTIFY_AUTHORIZATION_URL ?? '')
    //     redirect.search = query.toString()
    //     res
    //       .status(302)
    //       .redirect(redirect.toString())
    //   },
    // )
    // .get(
    //   '/authentication/spotify/callback',
    //   async function handler(req: FastifyRequest<{ Querystring: { code: string } }>, res) {
    //     const options = {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    //       },
    //       body: new URLSearchParams({
    //         grant_type: 'authorization_code',
    //         code: req.query.code,
    //         redirect_uri: process.env.SPOTIFY_REDIRECT_URI ?? '',
    //       }).toString(),
    //     }
    //     const response = await fetch(process.env.SPOTIFY_TOKEN_URL ?? '', options)
    //     const json = await response.json() as { access_token: string }
    //     res
    //       .header('set-cookie', `access_token=${json.access_token}; Path=/; HttpOnly`)
    //       .status(302)
    //       .redirect('/home/spotify')
    //   },
    // )
    // .get(
    //   '/authentication/twitter',
    //   async function handler(req, res) {
    //     const scopes = [
    //       'users.read',
    //       'tweet.read',
    //     ]
    //     const state = randomBytes(16).toString('base64')
    //     // proof key for code exchange (PKCE)
    //     const codeVerifier = randomBytes(128).toString('base64')
    //     const codeChallenge = generateCodeChallenge(codeVerifier)
    //     const query = new URLSearchParams({
    //       response_type: 'code',
    //       client_id: process.env?.TWITTER_CLIENT_ID ?? '',
    //       scope: scopes.join(' '),
    //       redirect_uri: process.env?.TWITTER_REDIRECT_URI ?? '',
    //       state,
    //       code_challenge: codeChallenge,
    //       code_challenge_method: 'S256', // SHA-256
    //     })
    //     const redirect = new URL(process.env.TWITTER_AUTHORIZATION_URL ?? '')
    //     redirect.search = query.toString()

  //     res
  //       .header('set-cookie', [
  //         `code_verifier=${codeVerifier}; Path=/; HttpOnly`,
  //         `verifier=${codeVerifier}; Path=/; HttpOnly`,
  //       ])
  //       .status(302)
  //       .redirect(redirect.toString())
  //   },
  // )
  // .get(
  //   '/authentication/twitter/callback',
  //   async function handler(req: FastifyRequest<{ Querystring: { state: string, code: string } }>, res) {
  //     const data = req.headers['cookie'] ?? ''
  //     const cookies = data.split(';')
  //     const state = cookies.find((cookie) => cookie.trim().startsWith('state'))
  //       ?.split('=')[1]
  //     if (state !== req.query.state) {
  //       res.status(302).redirect('/home/twitter/#?error=ERROR_STATE_MISMATCH')
  //     }

  //     const verifier = cookies.find((cookie) => cookie.trim().startsWith('verifier'))
  //       ?.split('=')[1]
  //     const options = {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //       body: new URLSearchParams({
  //         code: req.query.code,
  //         grant_type: 'authorization_code',
  //         redirect_uri: process.env.TWITTER_REDIRECT_URI ?? '',
  //         client_id: process.env.TWITTER_CLIENT_ID ?? '',
  //         code_verifier: verifier ?? '',
  //       }).toString(),
  //     }
  //     const response = await fetch(process.env.TWITTER_TOKEN_URL ?? '', options)
  //     const json = await response.json() as { access_token: string }
  //     res
  //       .header('set-cookie', `access_token=${json.access_token}; Path=/; HttpOnly`)
  //       .status(302)
  //       .redirect('/home/twitter/')
  //   },
  // )
  // .get('/authentication/discord', async function handler() {
  //   const scopes = [
  //     'identify',
  //     'guilds',
  //   ]
  //   const options = {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     body: new URLSearchParams({
  //       grant_type: 'client_credentials',
  //       client_id: process.env.DISCORD_CLIENT_ID ?? '',
  //       scope: scopes.join(' '),
  //       client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
  //     }).toString(),
  //   }
  //   const response = await fetch(process.env.DISCORD_TOKEN_URL ?? '', options)
  //   const json = await response.json() as { access_token: string }
  //   const headers = new Headers()
  //   headers.append('Authorization', `Bearer ${json.access_token}`)

  //   const [
  //     user,
  //     guilds,
  //   ] = await Promise.all([
  //     fetch(process.env.DISCORD_USER_URL ?? '', {
  //       headers,
  //     }).then((response) => response.json() as Promise<{ username: string, discriminator: string }>),
  //     fetch(process.env.DISCORD_GUILD_URL ?? '', {
  //       headers,
  //     }).then((response) => response.json() as Promise<{ name: string }[]>),
  //   ])
  //   return {
  //     user: `${user.username}#${user.discriminator}`,
  //     guilds: guilds.map((guild: { name: string }) => guild.name),
  //   }
  // })
}
