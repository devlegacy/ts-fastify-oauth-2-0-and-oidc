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
import {
  request,
} from 'undici'

import {
  type Config,
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'
import {
  fastifyBootstrap,
} from '#@/src/Contexts/Shared/infrastructure/http/fastifyBootstrap.js'
import {
  info,
  logger,
} from '#@/src/Contexts/Shared/infrastructure/Logger/PinoLogger.js'

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
        const data = {
          title: 'Home',
          ...twitch,
          ...auth0,
        }
        return res.viewAsync('./src/apps/oauth-client/home.ejs', data)
      })
      // eslint-disable-next-line max-lines-per-function
      .get('/home/spotify', async (req, res) => {
        const {
          cookies,
        } = req
        const accessToken = cookies[config.get('spotify.cookie.accessToken')] ?? cookies['access_token'] ?? ''

        const headers = new Headers()
        headers.append('Authorization', `Bearer ${accessToken}`)

        const meUrl = new URL(`${config.get('spotify.apiUrl')}/me`)
        const meRequest = await request(meUrl, {
          headers,
        })
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
        const accessToken = req.cookies[config.get('twitter.cookie.accessToken')] ?? req.cookies['access_token'] ?? ''
        // twitter use cors
        const response = await request(`${config.get('app.url')}/api/twitter/bypass`, {
          headers: {
            Authorization: accessToken,
            ...req.headers,
          },
          // credentials: 'include',
        })
        const {
          me,
          tweets,
        } = await response.body.json() as { me: { id: string }, tweets: unknown[] }
        return res.viewAsync('./src/apps/oauth-client/twitterHome.ejs', {
          title: 'Home',
          accessToken,
          me,
          tweets,
          twitterApiUrl: config.get('twitter.apiUrl'),
        })
      })
      .get('/home/auth0', async (req, res) => {
        const accessToken = req.cookies['access_token'] ?? req.cookies['auth0_access_token'] ?? ''
        return res.viewAsync('./src/apps/oauth-client/auth0Home.ejs', {
          title: 'Home',
          accessToken,
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
