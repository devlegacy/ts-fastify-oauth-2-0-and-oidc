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
    accessToken: {
      secret: {
        doc: 'The secret to sign the access token.',
        format: String,
        default: 'secret',
        env: 'ACCESS_TOKEN_SECRET',
      },
      expirationTime: {
        doc: 'The expiration time in secomds of the access token.',
        format: Number,
        default: 900,
        env: 'ACCESS_TOKEN_EXPIRATION_TIME',
      },
      privateKeyPath: {
        doc: 'The path to the private key to sign the access token.',
        format: String,
        default: '',
        env: 'ACCESS_TOKEN_PRIVATE_KEY_PATH',
      },
      publicKeyPath: {
        doc: 'The path to the public key to verify the access token.',
        format: String,
        default: '',
        env: 'ACCESS_TOKEN_PUBLIC_KEY_PATH',
      },
    },
    spotify: {
      clientId: {
        doc: 'The Spotify client id.',
        format: String,
        default: '',
        env: 'SPOTIFY_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The Spotify client secret.',
        format: String,
        default: '',
        env: 'SPOTIFY_CLIENT_SECRET',
      },
      authorizationUrl: {
        doc: 'The Spotify authorization url.',
        format: 'url',
        default: 'https://accounts.spotify.com/authorize',
        env: 'SPOTIFY_AUTHORIZATION_URL',
      },
      tokenUrl: {
        doc: 'The Spotify token url.',
        format: 'url',
        default: 'https://accounts.spotify.com/api/token',
        env: 'SPOTIFY_TOKEN_URL',
      },
      redirectUri: {
        doc: 'The Spotify redirect uri.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'SPOTIFY_REDIRECT_URI',
      },
      apiUrl: {
        doc: 'The Spotify api url.',
        format: 'url',
        default: 'https://api.spotify.com/v1',
        env: 'SPOTIFY_API_URL',
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
