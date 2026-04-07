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
  Headers,
  request,
} from 'undici'

import {
  config,
} from '#/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'
import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#/src/Contexts/Shared/domain/time.js'
import {
  accessTokenJwksValidator,
} from '#/src/Contexts/Shared/infrastructure/accessTokenJwksValidator.js'
import {
  accessTokenSigner,
} from '#/src/Contexts/Shared/infrastructure/accessTokenSigner.js'
import {
  codeChallengeGenerator,
} from '#/src/Contexts/Shared/infrastructure/codeChallengeGenerator.js'
import {
  getBasicCredentials,
} from '#/src/Contexts/Shared/infrastructure/http/getBasicCredentials.js'
import {
  getUser,
} from '#/src/Contexts/Shared/infrastructure/Users/getUser.js'
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
        const accessToken = accessTokenSigner(
          user,
          {
            expirationTime: config.get('accessToken.expirationTime'),
            secret: config.get('accessToken.secret'),
          },
        )
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
          headers: headers as HeadersInit,
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('spotify.redirectUri'),
          }).toString(),
        } satisfies RequestInit
        const oauthRequest = await request(config.get('spotify.tokenUrl') ?? '', options)
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
        const oauthResource = await oauthRequest.body.json() as SpotifyTokenResponse
        res
          // .setCookie('access_token', resource.access_token, {
          .setCookie(
            config.get('spotify.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              expires: new Date(Date.now() + oauthResource.expires_in * ONE_SECOND_IN_MILLISECONDS),
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
        const state = randomBytes(16).toString('base64url')
        // proof key for code exchange (PKCE)
        // RFC 7636: verifier must be 43-128 unreserved chars; 32 bytes → 43 base64url chars
        const codeVerifier = randomBytes(32).toString('base64url')
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
        const authorizationUrl = new URL(config.get('twitter.authorizationUrl'))
        authorizationUrl.search = query.toString()

        // Redirect to the Twitter Accounts service (Concern request UI)
        res
          // .setCookie('verifier', codeVerifier, {
          .setCookie(
            config.get('twitter.cookie.oauthCodeVerifier'),
            codeVerifier,
            {
              path: '/',
              httpOnly: true,
            },
          )
          // .setCookie('state', state, {
          .setCookie(
            config.get('twitter.cookie.oauthState'),
            state,
            {
              path: '/',
              httpOnly: true,
            },
          )
          .status(HttpStatus.FOUND)
          .redirect(authorizationUrl.toString())
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
        const {
          cookies,
        } = req
        const state = cookies[config.get('twitter.cookie.oauthState')] ?? ''
        if (state !== req.query.state) {
          return res.status(HttpStatus.FOUND).redirect('/?error=ERROR_STATE_MISMATCH')
        }

        const codeVerifier = cookies[config.get('twitter.cookie.oauthCodeVerifier')] ?? ''
        const clientCredentials = Buffer.from(
          `${config.get('twitter.clientId')}:${config.get('twitter.clientSecret')}`,
        ).toString('base64')
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${clientCredentials}`,
          },
          body: new URLSearchParams({
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: config.get('twitter.redirectUri'),
            code_verifier: codeVerifier,
          }).toString(),
        } satisfies RequestInit
        const oauthRequest = await request(config.get('twitter.tokenUrl'), options)
        type TwitterTokenResponse = {
          token_type: string
          expires_in: number
          access_token: string
          scope: string
          error?: string
          error_description?: string
        }
        const oauthResource = await oauthRequest.body.json() as TwitterTokenResponse
        if (oauthResource.error || !oauthResource.access_token) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: oauthResource.error ?? 'Token exchange failed',
            error_description: oauthResource.error_description,
          })
        }
        res
          .setCookie(
            config.get('twitter.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/twitter')
      },
    )
    .get(
      // single page application (SPA) callback
      '/authentication/twitch/callback',
      async function handler(req: FastifyRequest<{ Querystring: { state: string, code: string } }>, res) {
        return res.viewAsync('./src/apps/oauth-client/twitchHome.ejs', {
          title: 'Home Twitch 🎮',
          TWITCH_API_URL: config.get('twitch.apiUrl'),
          TWITCH_CLIENT_ID: config.get('twitch.clientId'),
        })
      },
    )
    // bot and testing
    // no resource owner
    // machine-to-machine (M2M) authentication
    // Note: Client Credentials only supports 'identify' scope
    .get('/authentication/discord', async function handler() {
      const scopes = [
        'identify',
        // 'guilds',
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
      } satisfies RequestInit
      const oauthRequest = await request(config.get('discord.tokenUrl'), options)
      const oauthResource = await oauthRequest.body.json() as { access_token: string }
      const headers = new Headers()
      headers.append('Authorization', `Bearer ${oauthResource.access_token}`)

      const [
        user,
        guilds,
      ] = await Promise.all([
        request(`${config.get('discord.apiUrl')}/users/@me`, {
          headers,
        })
          .then((response) => response.body.json() as Promise<{ id: string, username: string, discriminator: string }>),
        // Note: Client Credentials grant only supports 'identify' scope; guilds fetch may return empty or fail
        request(`${config.get('discord.apiUrl')}/users/@me/guilds`, {
          headers,
        })
          .then((response) => response.body.json() as Promise<{ name: string }[]>)
          .catch(() => [] as { name: string }[]),
      ])
      return {
        user: `${user.username}`,
        url: `https://discordapp.com/users/${user.id}`,
        discord: `discord://discordapp.com/users/${user.id}`,
        guilds: guilds.map((guild: { name: string }) => guild.name),
      }
    })
  // Discord with Authorization Code Flow (for user-specific scopes like dm_channels.read)
    .get('/authentication/discord-special', async function handler(_req, res) {
      /**
       * Discord OAuth2 Scopes
       * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
       */
      const scopes = [
        'identify',
        'guilds',
        'dm_channels.read',
        // 'messages.read',
        // 'dm_channels.messages.read',
      ]
      const state = randomBytes(16).toString('base64')
      const authorizationSearchParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.get('discord.clientId'),
        scope: scopes.join(' '),
        redirect_uri: config.get('discord.redirectUri'),
        state,
      })
      const authorizationUrl = new URL(config.get('discord.authorizationUrl'))
      authorizationUrl.search = authorizationSearchParams.toString()

      // Store state in cookie for CSRF protection
      res
        .setCookie(
          config.get('discord.cookie.oauthState'),
          state,
          {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: config.get('app.env') !== 'local',
          },
        )
        .status(HttpStatus.FOUND)
        .redirect(authorizationUrl.toString())
    })
    .get(
      '/authentication/discord-special/callback',
      async function handler(req: FastifyRequest<{ Querystring: { code?: string, state?: string, error?: string, error_description?: string } }>, res) {
        if (req.query.error) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: req.query.error,
            error_description: req.query.error_description,
          })
        }
        if (!req.query.code) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'Missing authorization code',
          })
        }
        const {
          cookies,
        } = req
        const stateCookie = cookies[config.get('discord.cookie.oauthState')]
        const requestState = req.query.state

        if (!stateCookie || !requestState || stateCookie !== requestState) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'State mismatch - possible CSRF attack',
          })
        }
        res.clearCookie(config.get('discord.cookie.oauthState'), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: config.get('app.env') !== 'local',
        })

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('discord.redirectUri'),
            client_id: config.get('discord.clientId'),
            client_secret: config.get('discord.clientSecret'),
          }).toString(),
        } satisfies RequestInit

        const oauthRequest = await request(config.get('discord.tokenUrl'), options)
        if (oauthRequest.statusCode < 200 || oauthRequest.statusCode >= 300) {
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: 'Discord token exchange failed',
            details: await oauthRequest.body.text(),
          })
        }
        type DiscordTokenResponse = {
          access_token: string
          token_type: string
          expires_in: number
          refresh_token: string
          scope: string
        }
        const oauthResource = await oauthRequest.body.json() as DiscordTokenResponse
        if (!oauthResource.access_token || !oauthResource.expires_in) {
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: 'Discord token response missing access token',
          })
        }

        res
          .setCookie(
            config.get('discord.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              expires: new Date(Date.now() + oauthResource.expires_in * ONE_SECOND_IN_MILLISECONDS),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/discord')
      },
    )
    .get('/authentication/google', async function handler(_req, res) {
      const scopes = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ]
      const state = randomBytes(16).toString('base64')
      const authorizationSearchParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.get('google.clientId'),
        scope: scopes.join(' '),
        redirect_uri: config.get('google.redirectUri'),
        state,
        access_type: 'offline',
        prompt: 'consent',
      })
      const authorizationUrl = new URL(config.get('google.authorizationUrl'))
      authorizationUrl.search = authorizationSearchParams.toString()

      res
        .setCookie(
          config.get('google.cookie.oauthState'),
          state,
          {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: config.get('app.env') !== 'local',
          },
        )
        .status(HttpStatus.FOUND)
        .redirect(authorizationUrl.toString())
    })
    .get(
      '/authentication/google/callback',
      async function handler(req: FastifyRequest<{ Querystring: { code: string, state: string } }>, res) {
        const {
          cookies,
        } = req
        const state = cookies[config.get('google.cookie.oauthState')] ?? ''
        if (state !== req.query.state) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'State mismatch - possible CSRF attack',
          })
        }

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('google.redirectUri'),
            client_id: config.get('google.clientId'),
            client_secret: config.get('google.clientSecret'),
          }).toString(),
        } satisfies RequestInit

        const oauthRequest = await request(config.get('google.tokenUrl'), options)
        type GoogleTokenResponse = {
          access_token: string
          token_type: string
          expires_in: number
          refresh_token?: string
          scope: string
        }
        const oauthResource = await oauthRequest.body.json() as GoogleTokenResponse

        res
          .setCookie(
            config.get('google.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              expires: new Date(Date.now() + oauthResource.expires_in * ONE_SECOND_IN_MILLISECONDS),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/google')
      },
    )
    .get('/authentication/microsoft', async function handler(_req, res) {
      const scopes = [
        'openid',
        'profile',
        'email',
        'User.Read',
      ]
      const state = randomBytes(16).toString('base64')
      const authorizationSearchParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.get('microsoft.clientId'),
        scope: scopes.join(' '),
        redirect_uri: config.get('microsoft.redirectUri'),
        state,
        response_mode: 'query',
      })
      const authorizationUrl = new URL(config.get('microsoft.authorizationUrl'))
      authorizationUrl.search = authorizationSearchParams.toString()

      res
        .setCookie(
          config.get('microsoft.cookie.oauthState'),
          state,
          {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: config.get('app.env') !== 'local',
          },
        )
        .status(HttpStatus.FOUND)
        .redirect(authorizationUrl.toString())
    })
    .get(
      '/authentication/microsoft/callback',
      // eslint-disable-next-line max-lines-per-function
      async function handler(req: FastifyRequest<{ Querystring: { code: string, state: string } }>, res) {
        const storedState = req.cookies[config.get('microsoft.cookie.oauthState')]
        const queryState = req.query.state

        if (!storedState || !queryState || storedState !== queryState) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'State mismatch - possible CSRF attack',
          })
        }
        res.clearCookie(config.get('microsoft.cookie.oauthState'), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: config.get('app.env') !== 'local',
        })

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('microsoft.redirectUri'),
            client_id: config.get('microsoft.clientId'),
            client_secret: config.get('microsoft.clientSecret'),
          }).toString(),
        } satisfies RequestInit

        const oauthRequest = await request(config.get('microsoft.tokenUrl'), options)
        const oauthResource = await oauthRequest.body.json() as {
          access_token?: string
          token_type?: string
          expires_in?: number
          refresh_token?: string
          scope?: string
          error?: string
          error_description?: string
          error_codes?: number[]
        }

        if (oauthResource.error) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: oauthResource.error,
            error_description: oauthResource.error_description,
            error_codes: oauthResource.error_codes,
          })
        }

        if (!oauthResource.access_token || !oauthResource.expires_in) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'No access token received',
          })
        }

        res
          .setCookie(
            config.get('microsoft.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              expires: new Date(Date.now() + oauthResource.expires_in * ONE_SECOND_IN_MILLISECONDS),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/microsoft')
      },
    )
    .get('/authentication/xbox', async function handler(_req, res) {
      const scopes = [
        'Xboxlive.signin',
        'Xboxlive.offline_access',
      ]
      const state = randomBytes(16).toString('base64')
      const authorizationSearchParams = new URLSearchParams({
        response_type: 'code',
        client_id: config.get('xbox.clientId'),
        scope: scopes.join(' '),
        redirect_uri: config.get('xbox.redirectUri'),
        state,
        response_mode: 'query',
      })
      const authorizationUrl = new URL(config.get('xbox.authorizationUrl'))
      authorizationUrl.search = authorizationSearchParams.toString()

      res
        .setCookie(
          config.get('xbox.cookie.oauthState'),
          state,
          {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: config.get('app.env') !== 'local',
          },
        )
        .status(HttpStatus.FOUND)
        .redirect(authorizationUrl.toString())
    })
    .get(
      '/authentication/xbox/callback',
      // eslint-disable-next-line max-lines-per-function
      async function handler(req: FastifyRequest<{ Querystring: { code: string, state: string } }>, res) {
        const {
          cookies,
        } = req
        const cookieState = cookies[config.get('xbox.cookie.oauthState')]
        const queryState = req.query.state

        if (!cookieState || !queryState || cookieState !== queryState) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'State mismatch - possible CSRF attack',
          })
        }
        res.clearCookie(config.get('xbox.cookie.oauthState'), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: config.get('app.env') !== 'local',
        })

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: config.get('xbox.redirectUri'),
            client_id: config.get('xbox.clientId'),
            client_secret: config.get('xbox.clientSecret'),
          }).toString(),
        } satisfies RequestInit

        const oauthRequest = await request(config.get('xbox.tokenUrl'), options)
        type XboxTokenResponse = {
          access_token?: string
          token_type?: string
          expires_in?: number
          refresh_token?: string
          scope?: string
          error?: string
          error_description?: string
        }
        const oauthResource = await oauthRequest.body.json() as XboxTokenResponse

        if (oauthResource.error) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: oauthResource.error,
            error_description: oauthResource.error_description,
          })
        }

        if (!oauthResource.access_token || !oauthResource.expires_in) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'No access token received',
          })
        }

        res
          .setCookie(
            config.get('xbox.cookie.accessToken'),
            oauthResource.access_token,
            {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              expires: new Date(Date.now() + oauthResource.expires_in * ONE_SECOND_IN_MILLISECONDS),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/xbox')
      },
    )
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
      } satisfies RequestInit
      const oauthRequest = await request(config.get('auth0.tokenUrl'), options)
      const oauthResource = await oauthRequest.body.json() as { access_token: string, expires_in: number }

      res
      // .setCookie('access_token', resource.access_token, {
        .setCookie(config.get('auth0.cookie.accessToken'), oauthResource.access_token, {
          path: '/',
          httpOnly: true,
          // expires: new Date(Date.now() + resource.expires_in * ONE_MINUTE_IN_MILLISECONDS),
          // domain: config.get('app.url'),
        })
        .status(HttpStatus.FOUND)
        .redirect('/home/auth0')
    })
    // Connect with Auth0 using Implicit Flow With Form Post
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
    // Steam OpenID 2.0 Authentication
    // Steam does not use OAuth 2.0 but OpenID 2.0 — the API key is used for Web API calls after authentication
    .get('/authentication/steam', async function handler(_req, res) {
      const authorizationSearchParams = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': config.get('steam.redirectUri'),
        'openid.realm': config.get('app.url'),
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      })
      const authorizationUrl = new URL(config.get('steam.authorizationUrl'))
      authorizationUrl.search = authorizationSearchParams.toString()
      res.status(HttpStatus.FOUND).redirect(authorizationUrl.toString())
    })
    .get(
      '/authentication/steam/callback',
      async function handler(req: FastifyRequest<{ Querystring: Record<string, string> }>, res) {
        // Verify the OpenID assertion with Steam
        const verifyParams = new URLSearchParams(req.query)
        verifyParams.set('openid.mode', 'check_authentication')

        const verifyRequest = await request(config.get('steam.authorizationUrl'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: verifyParams.toString(),
        } satisfies RequestInit)
        const verifyBody = await verifyRequest.body.text()

        if (!verifyBody.includes('is_valid:true')) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'Steam OpenID verification failed',
          })
        }

        // Extract Steam ID64 from claimed_id: https://steamcommunity.com/openid/id/<steamid64>
        const claimedId = req.query['openid.claimed_id'] ?? ''
        const [
          ,
          steamId,
        ] = claimedId.match(/\/openid\/id\/(\d+)/) ?? []
        if (!steamId) {
          return res.status(HttpStatus.BAD_REQUEST).send({
            error: 'Invalid Steam ID in OpenID response',
          })
        }

        res
          .setCookie(
            config.get('steam.cookie.steamId'),
            steamId,
            {
              path: '/',
              httpOnly: true,
              secure: config.get('app.env') !== 'local',
              sameSite: 'lax',
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          )
          .status(HttpStatus.FOUND)
          .redirect('/home/steam')
      },
    )
    .get('/authentication/local/callback', async function handler(req: FastifyRequest<{ Querystring: { code: string } }>) {
      const {
        code,
      } = req.query

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.get('local.redirectUri'),
          client_id: config.get('local.clientId'),
          client_secret: config.get('local.clientSecret'),
        }).toString(),
      } satisfies RequestInit

      const oauthRequest = await request(config.get('local.tokenUrl'), options)
      const oauthResource = await oauthRequest.body.json() as { access_token: string, expires_in: number }

      const data = await request(config.get('local.testUrl'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${oauthResource.access_token}`,
          'Content-Type': 'application/json',
        },
      } satisfies RequestInit)
      const json = await data.body.json()
      return json
    })
}
