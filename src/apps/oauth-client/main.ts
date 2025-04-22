import process, {
  exit,
} from 'node:process'

import {
  config,
} from '#@/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'
import {
  error,
} from '#@/src/Contexts/Shared/infrastructure/Logger/PinoLogger.js'

import {
  AppBackend,
} from './server.js'

process
  .on('unhandledRejection', (err, origin) => {
    error({
      error: err,
      origin,
    })
    // for security reasons, we should exit the process when an unhandled rejection occurs but we would need to handle the error properly and avoid the process to exit
    exit(1)
  })
  .on('uncaughtException', (err) => {
    error(err)
  })

try {
  const app = new AppBackend(config)
  await app.start()
} catch (err) {
  error(err instanceof Error ? `${err.message}` : `unknown error`)
  exit(1)
}
