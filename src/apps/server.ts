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
  type PrintRoutesOptions,
} from 'fastify'

import {
  type Config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'
import {
  fastifyBootstrap,
} from '#@/src/Contexts/Shared/infrastructure/http/fastifyBootstrap.js'
import {
  info, logger,
} from '#@/src/Contexts/Shared/infrastructure/Logger/PinoLogger.js'

const fastify = Fastify({
  logger: logger() as FastifyBaseLogger,
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

  async #startHttpServer() {
    const dir = resolve(__dirname, './controllers')
    fastifyBootstrap(this.#adapter, {
      autoload: {
        dir,
      },
    })
    // this.#adapter
    //   .register(import('@fastify/view'), {
    //     engine: {
    //       ejs: import('ejs'),
    //     },
    //     layout: './src/apps/layout.ejs',
    //     includeViewExtension: true,
    //     viewExt: 'ejs',
    //   })
    //   .get('/', async (req, res) => {
    //     return res.viewAsync('./src/apps/home.ejs', {
    //       title: 'Home',
    //     })
    //   })
    //   .get('/home/spotify', async (req, res) => {
    //     const accessToken = req.cookies['access_token'] ?? ''
    //     return res.viewAsync('./src/apps/spotifyHome.ejs', {
    //       title: 'Home',
    //       accessToken,
    //       spotifyApiUrl: process.env.SPOTIFY_API_URL,
    //     })
    //   })
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
