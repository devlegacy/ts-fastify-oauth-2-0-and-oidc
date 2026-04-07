import {
  type Server,
} from 'node:http'
import {
  dirname,
  resolve,
} from 'node:path'
import {
  fileURLToPath,
  URL,
} from 'node:url'

import Fastify, {
  type FastifyBaseLogger,
  type PrintRoutesOptions,
} from 'fastify'
import HttpStatus from 'http-status'
import {
  Headers,
  request,
} from 'undici'

import {
  type Config,
  config,
} from '#/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'
import {
  fastifyBootstrap,
} from '#/src/Contexts/Shared/infrastructure/http/fastifyBootstrap.js'
import {
  info,
  logger,
} from '#/src/Contexts/Shared/infrastructure/Logger/PinoLogger.js'

const fastify = Fastify({
  loggerInstance: logger() as FastifyBaseLogger,
})
const printRoutesOptions: PrintRoutesOptions = {
  commonPrefix: false,
  includeHooks: true,
  includeMeta: true,
}
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

type XuiClaims = {
  gtg: string
  xid: string
  uhs: string
  agg: string
  usr: string
  utr: string
  prv: string
}

async function fetchXboxLiveAuth(accessToken: string): Promise<{ xstsToken: string, xuiData: XuiClaims, notAfter: string }> {
  const jsonHeaders = new Headers()
  jsonHeaders.append('Content-Type', 'application/json')
  jsonHeaders.append('Accept', 'application/json')

  const xblAuthResponse = await request(config.get('xbox.xboxLiveAuthUrl'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: `d=${accessToken}`,
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
    }),
  })
  if (xblAuthResponse.statusCode < 200 || xblAuthResponse.statusCode >= 300) {
    const body = await xblAuthResponse.body.text()
    throw new Error(`Xbox Live auth failed with status ${xblAuthResponse.statusCode}: ${body}`)
  }
  const xblAuth = await xblAuthResponse.body.json() as {
    Token: string
    DisplayClaims: { xui: { uhs: string }[] }
  }
  if (!xblAuth.Token) throw new Error('Xbox Live auth response missing Token')

  const xstsResponse = await request(config.get('xbox.xboxLiveXstsUrl'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [
          xblAuth.Token,
        ],
      },
      RelyingParty: 'http://xboxlive.com',
      TokenType: 'JWT',
    }),
  })
  if (xstsResponse.statusCode < 200 || xstsResponse.statusCode >= 300) {
    const body = await xstsResponse.body.text()
    throw new Error(`XSTS auth failed with status ${xstsResponse.statusCode}: ${body}`)
  }
  const xsts = await xstsResponse.body.json() as {
    Token: string
    NotAfter: string
    DisplayClaims: { xui: XuiClaims[] }
  }
  if (!xsts.Token) throw new Error('XSTS response missing Token')

  const xuiData = xsts.DisplayClaims.xui?.[0]
  if (!xuiData) throw new Error('No XUI data in XSTS response')

  return {
    xstsToken: xsts.Token,
    notAfter: xsts.NotAfter,
    xuiData,
  }
}

type CachedXboxToken = Awaited<ReturnType<typeof fetchXboxLiveAuth>>

async function resolveXboxToken(
  accessToken: string,
  cachedRaw: string,
  onNewToken: (token: CachedXboxToken, maxAge: number) => void,
  onClearCache: () => void,
): Promise<CachedXboxToken | undefined> {
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw) as CachedXboxToken
      if (new Date(cached.notAfter).getTime() > Date.now()) {
        return cached
      }
      // Cached token expired — clear it and re-fetch
      onClearCache()
    } catch {
      onClearCache()
    }
  }
  try {
    const token = await fetchXboxLiveAuth(accessToken)
    const maxAge = Math.floor((new Date(token.notAfter).getTime() - Date.now()) / 1000)
    if (maxAge > 0) {
      onNewToken(token, maxAge)
    }
    return token
  } catch {
    return undefined
  }
}

export class AppBackend {
  readonly #config: Config
  #adapter = fastify
  #httpServer?: Server

  get httpServer() {
    return this.#httpServer
  }

  constructor(config: Config) {
    this.#config = config
    this.#httpServer = this.#adapter.server
  }

  // eslint-disable-next-line max-lines-per-function
  async #startHttpServer() {
    const dir = resolve(__dirname, './controllers')
    await fastifyBootstrap(this.#adapter, {
      autoload: {
        dir,
      },
      static: {
        prefix: '/',
        root: resolve(__dirname, './public'),
      },
    })
    this.#adapter
      .get('/', async (req, res) => {
        const twitch = {
          TWITCH_CLIENT_ID: config.get('twitch.clientId'),
          TWITCH_REDIRECT_URI: config.get('twitch.redirectUri'),
          TWITCH_AUTHORIZATION_URL: config.get('twitch.authorizationUrl'),
        }
        const auth0 = {
          AUTH0_AUTHORIZATION_URL: config.get('auth0.authorizationUrl'),
          AUTH0_AUDIENCE: config.get('auth0.audience'),
          AUTH0_CLIENT_ID: config.get('auth0.clientId'),
          AUTH0_REDIRECT_URI: config.get('auth0.redirectUri'),
        }
        const local = {
          LOCAL_CLIENT_ID: config.get('local.clientId'),
          LOCAL_AUTHORIZATION_URL: config.get('local.authorizationUrl'),
          LOCAL_REDIRECT_URI: config.get('local.redirectUri'),
        }
        const data = {
          title: 'Home',
          ...twitch,
          ...auth0,
          ...local,
        }
        return res.viewAsync('./src/apps/oauth-client/home.ejs', data)
      })
      // eslint-disable-next-line max-lines-per-function
      .get('/home/spotify', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('spotify.cookie.accessToken')] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')

        const headers = new Headers()
        headers.append('Authorization', `Bearer ${accessToken}`)

        const meUrl = new URL(`${config.get('spotify.apiUrl')}/me`)
        const meRequest = await request(meUrl, {
          headers,
        })
        if (meRequest.statusCode < 200 || meRequest.statusCode >= 300) {
          const body = await meRequest.body.text()
          return res.status(meRequest.statusCode).send({
            error: body,
          })
        }
        const meResource = await meRequest.body.json() as {
          country: string
          display_name: string
          email: string
          explicit_content: {
            filter_enabled: boolean
            filter_locked: boolean
          }
          external_urls: {
            spotify: string
          }
          followers: {
            href: null | string
            total: number
          }
          href: string
          id: string
          images: string[]
          product: string
          type: string
          uri: string
        }

        const playlistsUrl = new URL(`${config.get('spotify.apiUrl')}/users/${meResource.id}/playlists`)
        const playlistsRequest = await request(playlistsUrl, {
          headers,
        })
        if (playlistsRequest.statusCode < 200 || playlistsRequest.statusCode >= 300) {
          const body = await playlistsRequest.body.text()
          return res.status(playlistsRequest.statusCode).send({
            error: body,
          })
        }
        const playlistResources = await playlistsRequest.body.json() as {
          href: string
          limit: number
          next: null | string
          offset: number
          previous: null | string
          total: number
          items: {
            collaborative: boolean
            description: string
            external_urls: {
              spotify: string
            }
            href: string
            id: string
            images: {
              height: number
              url: string
              width: number
            }[]
            name: string
            owner: {
              display_name: string
              external_urls: {
                spotify: string
              }
              href: string
              id: string
              type: string
              uri: string
            }
            primary_color: null | string
            public: boolean
            snapshot_id: string
            tracks: {
              href: string
              total: number
            }
            type: string
            uri: string
          }[]
        }
        // const headers = new Headers()
        // headers.append('Authorization', 'Bearer <%= accessToken %>')
        // const meRequest = await fetch('<%= spotifyApiUrl %>/me', {
        //   headers,
        // })
        // const me = await meRequest.json()
        // const playlistsRequest = await fetch(`<%= spotifyApiUrl %>/users/${me.id}/playlists`, {
        //   headers,
        // })
        // const playlists = await playlistsRequest.json()

        const data = {
          title: 'Home Spotify 🎧',
          // accessToken,
          meResource,
          playlistResources,
          spotifyApiUrl: config.get('spotify.apiUrl'),
        }
        return res.viewAsync('./src/apps/oauth-client/spotifyHome.ejs', data)
      })
      .get('/home/twitter', async (req, res) => {
        const accessToken = req.cookies[config.get('twitter.cookie.accessToken')] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')
        // twitter use cors
        const response = await request(`${config.get('app.url')}/api/twitter/bypass`, {
          headers: {
            Authorization: accessToken,
            Accept: 'application/json',
          },
        })
        const {
          me,
          tweets,
          error: twitterError,
        } = await response.body.json() as { me: { id: string } | null, tweets: unknown[], error?: unknown }
        if (!me) {
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: twitterError ?? 'Twitter API returned no user data',
          })
        }
        return res.viewAsync('./src/apps/oauth-client/twitterHome.ejs', {
          title: 'Home',
          accessToken,
          me,
          tweets,
          twitterApiUrl: config.get('twitter.apiUrl'),
        })
      })
      .get('/home/auth0', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('auth0.cookie.accessToken')] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')
        return res.viewAsync('./src/apps/oauth-client/auth0Home.ejs', {
          title: 'Home',
          accessToken,
        })
      })
      .get('/home/discord', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('discord.cookie.accessToken')] ?? cookies['discord_access_token'] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')

        const headers = new Headers()
        headers.append('Authorization', `Bearer ${accessToken}`)

        const [
          user,
          guilds,
          dmChannels,
        ] = await Promise.all([
          request(`${config.get('discord.apiUrl')}/users/@me`, {
            headers,
          })
            .then((response) => response.body.json() as Promise<{
              id: string
              username: string
              discriminator: string
              avatar: string
              global_name: string
            }>),
          request(`${config.get('discord.apiUrl')}/users/@me/guilds`, {
            headers,
          })
            .then((response) => response.body.json() as Promise<{
              id: string
              name: string
              icon: string
              owner: boolean
            }[]>),
          request(`${config.get('discord.apiUrl')}/users/@me/channels`, {
            headers,
          })
            .then((response) => response.body.json() as Promise<{
              id: string
              type: number
              recipients: {
                id: string
                username: string
                discriminator: string
                avatar: string
              }[]
            }[]>),
        ])

        return res.viewAsync('./src/apps/oauth-client/discordSpecialHome.ejs', {
          title: 'Home Discord 🎮',
          user,
          guilds,
          dmChannels,
        })
      })
      .get('/home/google', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('google.cookie.accessToken')] ?? cookies['google_access_token'] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')

        const headers = new Headers()
        headers.append('Authorization', `Bearer ${accessToken}`)

        const userInfo = await request(`${config.get('google.apiUrl')}/oauth2/v2/userinfo`, {
          headers,
        })
          .then((response) => response.body.json() as Promise<{
            id: string
            email: string
            verified_email: boolean
            name: string
            given_name: string
            family_name: string
            picture: string
            locale: string
          }>)

        return res.viewAsync('./src/apps/oauth-client/googleHome.ejs', {
          title: 'Home Google 🔍',
          userInfo,
        })
      })
      .get('/home/microsoft', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('microsoft.cookie.accessToken')] ?? cookies['microsoft_access_token'] ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')

        const headers = new Headers()
        headers.append('Authorization', `Bearer ${accessToken}`)

        const userInfo = await request(`${config.get('microsoft.apiUrl')}/me`, {
          headers,
        })
          .then((response) => response.body.json() as Promise<{
            id: string
            displayName: string
            givenName: string
            surname: string
            userPrincipalName: string
            mail: string
            jobTitle: string
            officeLocation: string
            mobilePhone: string
            businessPhones: string[]
          }>)

        return res.viewAsync('./src/apps/oauth-client/microsoftHome.ejs', {
          title: 'Home Microsoft 🪟',
          userInfo,
        })
      })
      .get('/home/xbox', async (req, res) => {
        const accessToken = req.cookies[config.get('xbox.cookie.accessToken')] ?? req.cookies.xbox_access_token ?? ''
        if (!accessToken) return res.status(HttpStatus.FOUND).redirect('/')

        const xblResult = await resolveXboxToken(
          accessToken,
          req.cookies[config.get('xbox.cookie.xboxToken')] ?? '',
          (token, maxAge) => {
            res.setCookie(config.get('xbox.cookie.xboxToken'), JSON.stringify(token), {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: config.get('app.env') !== 'local',
              maxAge,
            })
          },
          () => res.clearCookie(config.get('xbox.cookie.xboxToken'), {
            path: '/',
          }),
        )

        if (!xblResult) {
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: 'Failed to obtain Xbox Live or XSTS token',
          })
        }

        const {
          xstsToken,
          xuiData,
        } = xblResult
        const xuid = xuiData.xid

        const profileHeaders = new Headers()
        profileHeaders.append('Authorization', `XBL3.0 x=${xuiData.uhs};${xstsToken}`)
        profileHeaders.append('Accept-Language', 'en-US')
        profileHeaders.append('x-xbl-contract-version', '3')

        const settingsQuery = 'Gamertag,GameDisplayName,Gamerscore,ModernGamertag,ModernGamertagSuffix,UniqueModernGamertag'
        const profileResponse = await request(`${config.get('xbox.xboxApiUrl')}/users/xuid(${xuid})/profile/settings?settings=${settingsQuery}`, {
          headers: profileHeaders,
        })

        if (profileResponse.statusCode < 200 || profileResponse.statusCode >= 300) {
          const body = await profileResponse.body.text()
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: `Xbox profile API returned ${profileResponse.statusCode}: ${body}`,
          })
        }

        const profile = await profileResponse.body.json() as {
          profileUsers: {
            id: string
            hostId: string
            settings: {
              id: string
              value: string
            }[]
          }[]
        }

        return res.viewAsync('./src/apps/oauth-client/xboxHome.ejs', {
          title: 'Home Xbox 🎮',
          profile,
          gamertag: xuiData.gtg,
          xuid,
        })
      })
      .get('/home/steam', async (req, res) => {
        const steamId = req.cookies[config.get('steam.cookie.steamId')] ?? ''
        if (!steamId) return res.status(HttpStatus.FOUND).redirect('/')

        const apiUrl = new URL(`${config.get('steam.apiUrl')}/ISteamUser/GetPlayerSummaries/v0002/`)
        apiUrl.searchParams.set('key', config.get('steam.webApiKey'))
        apiUrl.searchParams.set('steamids', steamId)

        type SteamPlayerSummary = {
          steamid: string
          personaname: string
          profileurl: string
          avatar: string
          avatarmedium: string
          avatarfull: string
          personastate: number
          communityvisibilitystate: number
          realname?: string
          loccountrycode?: string
        }
        type SteamAlias = {
          newname: string
          timechanged: string
        }
        const [
          playerData,
          aliases,
        ] = await Promise.all([
          request(apiUrl.toString())
            .then((response) => response.body.json() as Promise<{
              response: {
                players: SteamPlayerSummary[]
              }
            }>),
          request(`https://steamcommunity.com/profiles/${steamId}/ajaxaliases/`)
            .then((response) => response.body.json() as Promise<SteamAlias[]>),
        ])

        const [
          player,
        ] = playerData.response.players

        if (!player) {
          return res.status(HttpStatus.BAD_GATEWAY).send({
            error: 'Unable to retrieve Steam player data',
          })
        }

        return res.viewAsync('./src/apps/oauth-client/steamHome.ejs', {
          title: 'Home Steam 🎮',
          player,
          aliases,
        })
      })
    await this.#adapter.listen(this.#config.get('http'))
    if (this.#config.get('app.env') === 'local') {
      info(this.#adapter.printRoutes(printRoutesOptions))
    }
  }

  async start() {
    await this.#startHttpServer()
  }

  async stop() {
    await this.#adapter.close()
  }
}
