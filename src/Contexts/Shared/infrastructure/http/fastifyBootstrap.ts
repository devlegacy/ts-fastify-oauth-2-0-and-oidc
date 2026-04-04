import {
  type AutoloadPluginOptions,
} from '@fastify/autoload'
import type {
  FastifyCorsOptions,
} from '@fastify/cors'
import type {
  FastifyStaticOptions,
} from '@fastify/static'
import {
  TokenError,
} from 'fast-jwt'
import {
  errorCodes,
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify'
import HttpStatus from 'http-status'

import {
  config,
} from '#/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'
import {
  UnauthorizedError,
} from '#/src/Contexts/Shared/domain/errors/UnauthorizedError.js'

// eslint-disable-next-line max-lines-per-function
export const fastifyBootstrap = async (
  fastify: FastifyInstance,
  options: {
    autoload: AutoloadPluginOptions
    cors?: FastifyCorsOptions
    static?: FastifyStaticOptions
  },
) => {
  // Register formbody plugin to handle application/x-www-form-urlencoded
  await fastify.register(import('@fastify/formbody'))
  await fastify.register(import('@fastify/multipart'))
  if (options.static) {
    fastify.register(import('@fastify/static'), {
      prefix: '/',
      ...options?.static,
    })
  }
  fastify
    .register(import('@fastify/autoload'), {
      forceESM: true,
      dirNameRoutePrefix: false,
      dir: options.autoload.dir,
      options: {
        prefix: '/api',
      },
      maxDepth: 10,
      matchFilter: (filename) => {
        // performance optimization with includes instead of regex
        return filename.includes('Controller')
      },
    })
    .register(import('@fastify/cors'), options.cors || {})
    .register(import('@fastify/compress'))
    .register(import('@fastify/cookie'))

    .register(import('@fastify/view'), {
      engine: {
        ejs: (await import('ejs')).default,
      },
      layout: `./src/Contexts/Shared/infrastructure/layout.ejs`,
      includeViewExtension: true,
      viewExt: 'ejs',
    })
    // eslint-disable-next-line complexity
    .setErrorHandler((err: FastifyError, req: FastifyRequest, res: FastifyReply) => {
      // Capture error
      // ...
      // Convert error to response
      let statusCode: typeof HttpStatus[keyof typeof HttpStatus] = HttpStatus.INTERNAL_SERVER_ERROR
      let prefixNonProductionMessage = ''
      // e instanceof errorCodes.constructor
      const isFastifyError = err.statusCode && (err instanceof errorCodes.FST_ERR_BAD_STATUS_CODE || err instanceof errorCodes.FST_ERR_CTP_EMPTY_JSON_BODY)
      // FastifyError createError
      if (isFastifyError) {
        statusCode = err.statusCode! as typeof HttpStatus[keyof typeof HttpStatus]
      } else if (err instanceof UnauthorizedError || err instanceof TokenError) {
        // hide unauthorized error message, protect sensitive information by hiding the real status and message
        statusCode = HttpStatus.NOT_FOUND
        prefixNonProductionMessage = config.get('app.env') !== 'production' ? `${HttpStatus[HttpStatus.UNAUTHORIZED]}. ` : ''
      }

      const error = `${prefixNonProductionMessage}${HttpStatus[statusCode as keyof typeof HttpStatus] || HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR]}`
      const response = {
        statusCode,
        error,
        message: err.message || 'unknown error',
        path: `Route ${req.raw.method}:${req.raw.url}`,
        code: err.code,
        stack: config.get('app.env') !== 'production' ? err.stack : undefined,
      }

      res.status(+(statusCode || HttpStatus.UNPROCESSABLE_ENTITY)).send(response)
    })
}
