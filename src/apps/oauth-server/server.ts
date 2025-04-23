import {
  createHash,
  randomBytes,
} from 'node:crypto'
import {
  type Server,
} from 'node:http'
import {
  dirname,
  resolve,
} from 'node:path'
import process from 'node:process'
import {
  fileURLToPath,
} from 'node:url'

import Fastify, {
  type FastifyBaseLogger,
  type FastifyRequest,
  type PrintRoutesOptions,
} from 'fastify'
import OAuth2Server from 'oauth2-server'

import {
  type Config,
  config,
} from '#@/src/Contexts/OauthServer/Shared/infrastructure/Config/config.js'
import {
  fastifyBootstrap,
} from '#@/src/Contexts/Shared/infrastructure/http/fastifyBootstrap.js'
import {
  info,
  logger,
} from '#@/src/Contexts/Shared/infrastructure/Logger/PinoLogger.js'
import {
  getUser,
} from '#@/src/Contexts/Shared/infrastructure/Users/getUser.js'

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

const {
  Request,
  Response,
} = OAuth2Server

const db = {
  authorizationCode: {
    authorizationCode: '',
    expiresAt: new Date(),
    redirectUri: '',
    client: null as OAuth2Server.Client | null,
    user: null as OAuth2Server.User | null,
  },
  client: {
    id: config.get('local.clientId'),
    redirectUris: [
      config.get('local.redirectUri'),
    ],
    grants: [
      'authorization_code',
    ],
    clientSecret: config.get('local.clientSecret'),
  },
  token: {
    accessToken: '',
    accessTokenExpiresAt: new Date(),
    client: null as OAuth2Server.Client | null,
    user: null as OAuth2Server.User | null,
  },
}

const oauth = new OAuth2Server({
  // @ts-expect-error model is not fully typed and implement, the functions have params that we are not using
  model: {
    async getClient(clientId, clientSecret): Promise<OAuth2Server.Client> {
      info(
        {
          clientId,
          clientSecret,
        },
        'getClient',
      )

      return db.client
    },
    async saveAuthorizationCode(code, client, user): Promise<OAuth2Server.AuthorizationCode> {
      info({
        code,
        client,
        user,
      }, 'saveAuthorizationCode')

      db.authorizationCode = {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        client,
        user,
      }

      return {
        ...db.authorizationCode,
        client,
        user,
      }
    },
    async getAuthorizationCode(authorizationCode) {
      info({
        authorizationCode,
      }, 'getAuthorizationCode')

      return db.authorizationCode as OAuth2Server.AuthorizationCode
    },
    async revokeAuthorizationCode(code) {
      info({
        code,
      }, 'revokeAuthorizationCode')

      db.authorizationCode = {
        authorizationCode: '',
        expiresAt: new Date(),
        redirectUri: '',
        client: null,
        user: null,
      }
      return true
    },
    async saveToken(token, client, user) {
      info({
        token,
        client,
        user,
      }, 'saveToken')

      db.token = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt as Date,
        client,
        user,
      }

      return {
        ...db.token,
        client,
        user,
      }
    },
    async getAccessToken(token) {
      if (!token && token !== db.token.accessToken) {
        throw new Error('Token not found')
      }
      return db.token as OAuth2Server.Token
    },
    async generateAuthorizationCode(client, user, scope) {
      info({
        client,
        user,
        scope,
      }, 'generateAuthorizationCode')
      const seed = randomBytes(256)
      const code = createHash('sha1').update(seed)
        .digest('hex')
      return code
    },
  },
  // grants: [
  //   'authorization_code',
  // ],
  allowEmptyState: true,
})

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
    })
    this.#adapter
      .get('/', async (req, res) => {
        return res.viewAsync('./src/apps/oauth-server/home.ejs', {
          title: 'Home',
        })
      })
      .get('/oauth/authorize', async (req: FastifyRequest<{ Querystring: { client_id: string, redirect_uri: string } }>, res) => {
        const data = {
          title: 'Concern Authorization',
          client_id: req.query.client_id || '',
          redirect_uri: req.query.redirect_uri || '',
          USER_USERNAME: process.env.USER_USERNAME || '',
          USER_PASSWORD: process.env.USER_PASSWORD || '',
        }
        return res.viewAsync('./src/apps/oauth-server/authorize.ejs', data)
      })
      .post('/oauth/authorize', async (req: FastifyRequest<{ Body: { client_id: string, redirect_uri: string, response_type: string, username: string, password: string } }>, res) => {
        const user = getUser(req.body.username, req.body.password)
        if (!user) {
          throw new Error('User not found')
        }
        // req.user = user

        const {
          redirect_uri,
        } = req.body
        const request = new Request(req)
        const response = new Response(res)
        const code = await oauth.authorize(
          request,
          response,
          {
            authenticateHandler: {
              handle() {
                // return req.user
                return user
              },
            },
          },
        )
        const clientRedirect = new URL(`${redirect_uri}?code=${code.authorizationCode}&state=${randomBytes(16).toString('base64')}`)
        res.redirect(clientRedirect.toString())
      })
      .post('/oauth/token', async (req: FastifyRequest<{ Body: { client_id: string, client_secret: string, code: string, redirect_uri: string, grant_type: string } }>, res) => {
        const request = new Request(req)
        const response = new Response(res)
        const token = await oauth.token(request, response)
        res.send({
          access_token: token.accessToken,
          token_type: 'Bearer',
          expires_in: token.accessTokenExpiresAt,
          refresh_token: token.refreshToken,
          scope: token.scope,
        })
      })
      .get('/private', async (req: FastifyRequest, res) => {
        const request = new Request(req)
        const response = new Response(res)
        const token = await oauth.authenticate(request, response)
        return {
          id: token.user?.id,
          username: token.user?.username,
          fullName: token.user?.fullName,
        }
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
