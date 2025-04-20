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
        doc: 'The expiration time in seconds of the access token.',
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
      cookie: {
        accessToken: {
          doc: 'The name of the cookie to store the access token.',
          format: String,
          default: 'spotify_access_token',
          env: 'SPOTIFY_ACCESS_TOKEN_COOKIE',
        },
      },
    },
    twitter: {
      clientId: {
        doc: 'The Twitter client id.',
        format: String,
        default: '',
        env: 'TWITTER_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The Twitter client secret.',
        format: String,
        default: '',
        env: 'TWITTER_CLIENT_SECRET',
      },
      authorizationUrl: {
        doc: 'The Twitter authorization url.',
        format: 'url',
        default: 'https://api.twitter.com/oauth/authorize',
        env: 'TWITTER_AUTHORIZATION_URL',
      },
      redirectUri: {
        doc: 'The Twitter redirect uri.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'TWITTER_REDIRECT_URI',
      },
      tokenUrl: {
        doc: 'The Twitter token url.',
        format: 'url',
        default: 'https://api.twitter.com/2/oauth2/token',
        env: 'TWITTER_TOKEN_URL',
      },
      apiUrl: {
        doc: 'The Twitter api url.',
        format: 'url',
        default: 'https://api.twitter.com/2',
        env: 'TWITTER_API_URL',
      },
      cookie: {
        accessToken: {
          doc: 'The name of the cookie to store the access token.',
          format: String,
          default: 'twitter_access_token',
          env: 'TWITTER_ACCESS_TOKEN_COOKIE',
        },
        oauthCodeVerifier: {
          doc: 'The name of the cookie to store the verifier.',
          format: String,
          default: 'oauth_twitter_code_verifier',
          env: 'TWITTER_OAUTH_CODE_VERIFIER_COOKIE',
        },
        oauthState: {
          doc: 'The name of the cookie to store the state.',
          format: String,
          default: 'oauth_twitter_state',
          env: 'TWITTER_OAUTH_STATE_COOKIE',
        },
      },
    },
    twitch: {
      clientId: {
        doc: 'The Twitch client id.',
        format: String,
        default: '',
        env: 'TWITCH_CLIENT_ID',
      },
      apiUrl: {
        doc: 'The Twitch api url.',
        format: 'url',
        default: 'https://api.twitch.tv/helix',
        env: 'TWITCH_API_URL',
      },
      redirectUri: {
        doc: 'The Twitch redirect uri.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'TWITCH_REDIRECT_URI',
      },
      authorizationUrl: {
        doc: 'The Twitch authorization url.',
        format: 'url',
        default: 'https://id.twitch.tv/oauth2/authorize',
        env: 'TWITCH_AUTHORIZATION_URL',
      },
    },
    discord: {
      clientId: {
        doc: 'The Discord client id.',
        format: String,
        default: '',
        env: 'DISCORD_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The Discord client secret.',
        format: String,
        default: '',
        env: 'DISCORD_CLIENT_SECRET',
      },
      tokenUrl: {
        doc: 'The Discord token url.',
        format: 'url',
        default: 'https://discord.com/api/v9/oauth2/token',
        env: 'DISCORD_TOKEN_URL',
      },
      apiUrl: {
        doc: 'The Discord api url.',
        format: 'url',
        default: 'https://discord.com/api/v9',
        env: 'DISCORD_API_URL',
      },
    },
    auth0: {
      clientId: {
        doc: 'The Auth0 client id.',
        format: String,
        default: '',
        env: 'AUTH0_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The Auth0 client secret.',
        format: String,
        default: '',
        env: 'AUTH0_CLIENT_SECRET',
      },
      tokenUrl: {
        doc: 'The Auth0 token url.',
        format: 'url',
        default: 'https://dev-1111.auth0.com/oauth/token',
        env: 'AUTH0_TOKEN_URL',
      },
      redirectUri: {
        doc: 'The Auth0 redirect uri.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'AUTH0_REDIRECT_URI',
      },
      authorizationUrl: {
        doc: 'The Auth0 authorization url.',
        format: 'url',
        default: 'https://dev-1111.auth0.com/authorize',
        env: 'AUTH0_AUTHORIZATION_URL',
      },
      jwksUri: {
        doc: 'The Auth0 jwks uri.',
        format: 'url',
        default: 'https://dev-1111.auth0.com/.well-known/jwks.json',
        env: 'AUTH0_JWKS_URI',
      },
      audience: {
        doc: 'The Auth0 audience.',
        format: 'url',
        default: 'http://localhost:8080',
        env: 'AUTH0_AUDIENCE',
      },
      username: {
        doc: 'The Auth0 username.',
        format: String,
        default: '',
        env: 'AUTH0_USERNAME',
      },
      password: {
        doc: 'The Auth0 password.',
        format: String,
        default: '',
        env: 'AUTH0_PASSWORD',
      },
    },
    // azure: {
    //   clientId: {
    //     doc: 'The Azure client id.',
    //     format: String,
    //     default: '',
    //     env: 'AZURE_CLIENT_ID',
    //   },
    //   clientSecret: {
    //     doc: 'The Azure client secret.',
    //     format: String,
    //     default: '',
    //     env: 'AZURE_CLIENT_SECRET',
    //   },
    //   // tokenUrl: {
    //   //   doc: 'The Azure token url.',
    //   //   format: 'url',
    //   //   default: '',
    //   //   env: 'AZURE_TOKEN_URL',
    //   // },
    //   redirectUri: {
    //     doc: 'The Azure redirect uri.',
    //     format: 'url',
    //     default: '',
    //     env: 'AZURE_REDIRECT_URI',
    //   },
    //   // authorizationUrl: {
    //   //   doc: 'The Azure authorization url.',
    //   //   format: 'url',
    //   //   default: '',
    //   //   env: 'AZURE_AUTHORIZATION_URL',
    //   // },
    //   // apiUrl: {
    //   //   doc: 'The Azure api url.',
    //   //   format: 'url',
    //   //   default: '',
    //   //   env: 'AZURE_API_URL',
    //   // },
    // },
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
