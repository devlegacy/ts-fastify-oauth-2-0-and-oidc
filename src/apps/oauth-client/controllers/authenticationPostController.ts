import {
  randomBytes,
} from 'node:crypto'
import {
  URL,
  URLSearchParams,
} from 'node:url'

import type {
  FastifyInstance,
  FastifyRequest,
} from 'fastify'
import HttpStatus from 'http-status'
import {
  request,
} from 'undici'

import {
  ONE_MINUTE_IN_MILLISECONDS,
} from '#@/src/Contexts/Shared/domain/time.js'
import {
  accessTokenJwksValidator,
} from '#@/src/Contexts/Shared/infrastructure/accessTokenJwksValidator.js'
import {
  accessTokenSigner,
} from '#@/src/Contexts/Shared/infrastructure/accessTokenSigner.js'
import {
  codeChallengeGenerator,
} from '#@/src/Contexts/Shared/infrastructure/codeChallengeGenerator.js'
import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'
import {
  getBasicCredentials,
} from '#@/src/Contexts/Shared/infrastructure/http/getBasicCredentials.js'
import {
  getUser,
} from '#@/src/Contexts/Users/infrastructure/getUser.js'
// eslint-disable-next-line max-lines-per-function
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
        const accessToken = accessTokenSigner(user)
        return {
          access_token: accessToken,
        }
      },
    )
    .get(
      '/authentication/spotify',
      async function handler(req, res) {
        /**
         * [Scopes | Spotify for Developers](https://developer.spotify.com/documentation/web-api/concepts/scopes)
         */
        const scopes = [
          'user-read-private',
          'user-read-email',
          'playlist-read-private',
        ]
        const authorizationSearchParams = new URLSearchParams({
          response_type: 'code',
          client_id: config.get('spotify.clientId'),
          scope: scopes.join(' '),
          redirect_uri: config.get('spotify.redirectUri'),
        })
        const authorizationUrl = new URL(config.get('spotify.authorizationUrl'))
        authorizationUrl.search = authorizationSearchParams.toString()
        // Redirect to the Spotify Accounts service (Concern request UI)
        res
          .status(HttpStatus.FOUND)
          .redirect(authorizationUrl.toString())
        // Then if the user do the authorize grant is redirected to callback URL
      },
    )
    .get(
      '/authentication/spotify/callback',
      async function handler(req: FastifyRequest<{ Querystring: { code: string } }>, res) {
        const clientCredentials = Buffer.from(`${config.get('spotify.clientId')}:${config.get('spotify.clientSecret')}`).toString('base64')
        const headers = new Headers()
        headers.append('Content-Type', 'application/x-www-form-urlencoded')
        headers.append('Authorization', `Basic ${clientCredentials}`)
        const options = {
          method: 'POST',
          headers,
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('spotify.redirectUri'),
          }).toString(),
        } satisfies RequestInit
        const tokenRequest = await request(config.get('spotify.tokenUrl') ?? '', options)
        type SpotifyTokenResponse = {
          access_token: string
          /**
           * time in seconds
           */
          expires_in: number
          refresh_token: string
          scope: string
          token_type: string
        }
        const tokenResource = await tokenRequest.body.json() as SpotifyTokenResponse
        res
          // .setCookie('access_token', resource.access_token, {
          .setCookie(
            config.get('spotify.accessTokenCookieName'),
            tokenResource.access_token,
            {
              path: '/',
              httpOnly: true,
              expires: new Date(Date.now() + tokenResource.expires_in * ONE_MINUTE_IN_MILLISECONDS),
            // domain: config.get('app.url'),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/spotify')
      },
    )
    .get(
      '/authentication/twitter',
      async function handler(req, res) {
        const scopes = [
          'tweet.read',
          'users.read',
        ]
        const state = randomBytes(16).toString('base64')
        // proof key for code exchange (PKCE)
        const codeVerifier = randomBytes(128).toString('base64')
        const codeChallenge = codeChallengeGenerator(codeVerifier)
        const query = new URLSearchParams({
          response_type: 'code',
          client_id: config.get('twitter.clientId'),
          scope: scopes.join(' '),
          redirect_uri: config.get('twitter.redirectUri'),
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256', // SHA-256
        })
        const redirect = new URL(config.get('twitter.authorizationUrl'))
        redirect.search = query.toString()

        res
          // .setCookie('verifier', codeVerifier, {
          .setCookie('twitter_verifier', codeVerifier, {
            path: '/',
            httpOnly: true,
          })
          // .setCookie('state', state, {
          .setCookie('twitter_state', state, {
            path: '/',
            httpOnly: true,
          })
          .status(HttpStatus.FOUND)
          .redirect(redirect.toString())
      },
    )
    // .get(
    //   '/authentication/xbox',
    //   async function handler(req, res) {
    //     const params = new URLSearchParams({
    //     })
    //     return {}
    //   },
    // )
    .get(
      '/authentication/twitter/callback',
      async function handler(req: FastifyRequest<{ Querystring: { state: string, code: string } }>, res) {
        const state = req.cookies['state'] ?? req.cookies['twitter_state'] ?? ''
        if (state !== req.query.state) {
          res.status(HttpStatus.FOUND).redirect('/home/twitter/#?error=ERROR_STATE_MISMATCH')
        }

        const verifier = req.cookies['verifier'] ?? req.cookies['twitter_verifier'] ?? ''
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: config.get('twitter.redirectUri'),
            client_id: config.get('twitter.clientId'),
            code_verifier: verifier,
          }).toString(),
        }
        const response = await fetch(config.get('twitter.tokenUrl'), options)
        type TwitterTokenResponse = {
          token_type: string
          expires_in: number
          access_token: string
          scope: string
        }
        const json = await response.json() as TwitterTokenResponse
        res
          // .setCookie('access_token', json.access_token, {
          .setCookie('twitter_access_token', json.access_token, {
            path: '/',
            httpOnly: true,
          })
          .status(HttpStatus.FOUND)
          .redirect('/home/twitter')
      },
    )
    .get(
      // single page application (SPA) callback
      '/authentication/twitch/callback',
      async function handler(req: FastifyRequest<{ Querystring: { state: string, code: string } }>, res) {
        return res.viewAsync('./src/apps/oauth-client/twitchHome.ejs', {
          title: 'Home',
          TWITCH_API_URL: config.get('twitch.apiUrl'),
          TWITCH_CLIENT_ID: config.get('twitch.clientId'),
        })
      },
    )
    // bot and testing
    // no resource owner
    // machine-to-machine (M2M) authentication
    .get('/authentication/discord', async function handler() {
      const scopes = [
        'identify',
        'guilds',
      ]
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.get('discord.clientId'),
          scope: scopes.join(' '),
          client_secret: config.get('discord.clientSecret'),
        }).toString(),
      }
      const response = await fetch(config.get('discord.tokenUrl'), options)
      const json = await response.json() as { access_token: string }
      const headers = new Headers()
      headers.append('Authorization', `Bearer ${json.access_token}`)

      const [
        user,
        guilds,
      ] = await Promise.all([
        fetch(`${config.get('discord.apiUrl')}/users/@me`, {
          headers,
        })
          .then((response) => response.json() as Promise<{ id: string, username: string, discriminator: string }>),
        fetch(`${config.get('discord.apiUrl')}/users/@me/guilds`, {
          headers,
        })
          .then((response) => response.json() as Promise<{ name: string }[]>),
      ])
      return {
        user: `${user.username}`,
        url: `https://discordapp.com/users/${user.id}`,
        discord: `discord://discordapp.com/users/${user.id}`,
        guilds: guilds.map((guild: { name: string }) => guild.name),
      }
    })
    .get('/authentication/auth0', async function handler(req, res) {
      const scopes = [
        'read:sample',
      ]
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: config.get('auth0.clientId'),
          client_secret: config.get('auth0.clientSecret'),
          scope: scopes.join(' '),
          audience: config.get('auth0.audience'),
          username: config.get('auth0.username'),
          password: config.get('auth0.password'),
        }).toString(),
      }
      const request = await fetch(config.get('auth0.tokenUrl'), options)
      const resource = await request.json() as { access_token: string, expires_in: number }

      res
      // .setCookie('access_token', resource.access_token, {
        .setCookie('auth0_access_token', resource.access_token, {
          path: '/',
          httpOnly: true,
          // expires: new Date(Date.now() + resource.expires_in * ONE_MINUTE_IN_MILLISECONDS),
          // domain: config.get('app.url'),
        })
        .status(HttpStatus.FOUND)
        .redirect('/home/auth0')
    })
    .post('/authentication/auth0/callback', async function handler(req: FastifyRequest<{ Body: { access_token: string, id_token: string, state: string } }>, res) {
      const {
        access_token,
        id_token,
        state,
      } = req.body

      const {
        nonce,
      } = await accessTokenJwksValidator(id_token, config.get('auth0.jwksUri'))

      const parameters = {
        access_token,
        id_token,
        state,
        nonce,
      }
      const query = new URLSearchParams(parameters).toString()
      // # for single page application (SPA)
      res.redirect(`/home/auth0#${query}`)
    })
}
