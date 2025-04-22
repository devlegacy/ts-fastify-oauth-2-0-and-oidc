import {
  env,
} from 'node:process'
import {
  styleText,
} from 'node:util'

env.SWCRC = true
env.TS_NODE_PROJECT = 'tsconfig.json'
env.FASTIFY_AUTOLOAD_TYPESCRIPT ??= 1
// process.env.NODE_OPTIONS = '--import @swc-node/register/esm-register'
// process.env.NODE_OPTIONS = '--loader ts-node/esm'

// eslint-disable-next-line no-console
console.log(styleText(
  'green',
  JSON.stringify(
    {
      // Node.js environment variables
      NODE_ENV: env.NODE_ENV || null,
      NODE_OPTIONS: env.NODE_OPTIONS || null,
      TZ: env.TZ || null,

      // TypeScript environment variables
      SWCRC: env.SWCRC || null,
      TS_NODE_PROJECT: env.TS_NODE_PROJECT || null,
      FASTIFY_AUTOLOAD_TYPESCRIPT: env.FASTIFY_AUTOLOAD_TYPESCRIPT || null,

      // Custom environment variables
      APP_ENV: env.APP_ENV || null,
    },
    null,
    2,
  ),
))

// '--loader @swc-node/register/esm-register',
// REVIEW: In Github CI. Cannot use 'progress-bar' formatter for output to 'stdout' as not a TTY. Switching to 'progress' formatter.
// '--format progress-bar',
const common = []

export const oauth_client = [
  ...common,
  'tests/apps/oauth-client/features/**/*.feature',
  '--import tests/apps/oauth-client/features/step_definitions/*.steps.ts',
].join(' ')

export default {
  oauth_client,
}
