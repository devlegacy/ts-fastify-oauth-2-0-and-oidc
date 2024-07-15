import {
  existsSync,
} from 'node:fs'
import {
  cwd,
  env,
  loadEnvFile,
} from 'node:process'

import convict from 'convict'
import convict_format_with_validator from 'convict-format-with-validator'
import {
  expand,
} from 'dotenv-expand'

const filePath = `${cwd()}/.${env.APP_ENV}.env`
const path = existsSync(filePath) ? filePath : `${cwd()}/.env`
loadEnvFile(path)
expand({
  // @ts-expect-error - we are not using the error property
  parsed: env,
})
convict.addFormats(convict_format_with_validator)
const config = convict(
  {
    app: {
      env: {
        doc: 'The application environment.',
        format: [
          'local',
          'development',
          'test',
          'staging',
          'production',
        ],
        default: 'local' as 'local' | 'development' | 'test' | 'staging' | 'production',
        env: 'APP_ENV',
      },
      url: {
        doc: 'The application url.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'APP_URL',
      },
    },
    http: {
      host: {
        doc: 'The IP address to bind.',
        format: 'ipaddress',
        default: '0.0.0.0',
        env: 'HTTP_HOST',
      },
      port: {
        doc: 'The port to bind.',
        format: 'port',
        default: 8080,
        env: 'HTTP_PORT',
        arg: 'port',
      },
    },
  },
)

const filePaths: string[] = []
config.loadFile(filePaths).validate({
  allowed: 'strict',
})

// const _schema = config.getSchema()
export type Config = typeof config

export {
  config
}
