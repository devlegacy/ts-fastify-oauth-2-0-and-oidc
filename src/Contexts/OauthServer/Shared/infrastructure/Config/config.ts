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
try {
  loadEnvFile(path)
} catch {
  expand({
    // @ts-expect-error - we are not using the error property
    parsed: env,
  })
}
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
        env: 'OAUTH_SERVER_APP_ENV',
      },
      url: {
        doc: 'The application url.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'OAUTH_SERVER_APP_URL',
      },
    },
    http: {
      host: {
        doc: 'The IP address to bind.',
        format: 'ipaddress',
        default: '0.0.0.0',
        env: 'OAUTH_SERVER_HTTP_HOST',
      },
      port: {
        doc: 'The port to bind.',
        format: 'port',
        default: 8080,
        env: 'OAUTH_SERVER_HTTP_PORT',
        arg: 'port',
      },
    },
    local: {
      clientId: {
        doc: 'The Local client id.',
        format: String,
        default: 'thirdpartyapp',
        env: 'LOCAL_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The Local client secret.',
        format: String,
        default: 'secret',
        env: 'LOCAL_CLIENT_SECRET',
      },
      authorizationUrl: {
        doc: 'The Local authorization url.',
        format: 'url',
        default: 'http://localhost:8081/oauth/authorize',
        env: 'LOCAL_AUTHORIZATION_URL',
      },
      redirectUri: {
        doc: 'The Local redirect uri.',
        format: 'url',
        default: 'http://localhost:8080/api/authentication/local/callback',
        env: 'LOCAL_REDIRECT_URI',
      },
      tokenUrl: {
        doc: 'The Local token url.',
        format: 'url',
        default: 'http://localhost:8081/oauth/token',
        env: 'LOCAL_TOKEN_URL',
      },
      testUrl: {
        doc: 'The Local test url.',
        format: 'url',
        default: 'http://localhost:8081/private',
        env: 'LOCAL_TEST_URL',
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
