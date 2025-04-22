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
  v7,
} from 'uuid'

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

const users = [
  {
    id: v7(),
    name: 'Samuel R.',
    username: 'jstsamuel',
    password: '123456',
  },
]

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
    clientId: config.get('local.clientId'),
    clientSecret: config.get('local.clientSecret'),
    redirectUris: [
      config.get('local.redirectUri'),
    ],
    grants: [
      'authorization_code',
    ],
  } satisfies OAuth2Server.Client,
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
    async getClient() {
      return db.client
    },
    async saveAuthorizationCode(code: OAuth2Server.AuthorizationCode, client: OAuth2Server.Client, user: OAuth2Server.User) {
      db.authorizationCode = {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        client,
        user,
      }

      return db.authorizationCode as OAuth2Server.AuthorizationCode
    },
    async getAuthorizationCode() {
      return db.authorizationCode as OAuth2Server.AuthorizationCode
    },
    async revokeAuthorizationCode() {
      db.authorizationCode = {
        authorizationCode: '',
        expiresAt: new Date(),
        redirectUri: '',
        client: null,
        user: null,
      }
      return true
    },
    async saveToken(token: OAuth2Server.Token, client: OAuth2Server.Client, user: OAuth2Server.User) {
      db.token = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt as Date,
        client,
        user,
      }
      return db.token as OAuth2Server.Token
    },
    async getAccessToken(token) {
      if (token !== db.token.accessToken) {
        throw new Error('Token not found')
      }
      return db.token as OAuth2Server.Token
    },
    async generateAuthorizationCode() {
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
      .get('/oauth/authorize', async (req: FastifyRequest<{ Querystring: { client_id: string, redirect_uri: string } }>, res) => {
        res
          .type('text/html')
          .send(`
            <form method="POST" action="/oauth/authorize">
              <p>Authorize ${req?.query?.client_id || ''} to access your account?</p>
              <input type="hidden" name="client_id" value="${req?.query?.client_id || ''}" />
              <input type="hidden" name="redirect_uri" value="${req?.query?.redirect_uri || ''}" />
              <input type="hidden" name="response_type" value="code" />
              <input type="hidden" name="username" value="jstsamuel" />
              <input type="hidden" name="password" value="123456" />

              <button type="submit">Authorize</button>
            </form>
          `)
      })
      .post('/oauth/authorize', async (req: FastifyRequest<{ Body: { client_id: string, redirect_uri: string, response_type: string, username: string, password: string } }>, res) => {
        const user = users.find((u) => u.username === req.body.username && u.password === req.body.password)
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
        const clientRedirect = new URL(`${redirect_uri}?code=${code.authorizationCode}&state=1234`)
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
        await oauth.authenticate(request, response)
        return {}
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
