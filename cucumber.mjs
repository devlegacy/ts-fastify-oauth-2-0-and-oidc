import process from 'node:process'
import {
  styleText,
} from 'node:util'

process.env.SWCRC = true
process.env.TS_NODE_PROJECT = 'tsconfig.json'
// process.env.NODE_OPTIONS = '--import @swc-node/register/esm-register'
// process.env.NODE_OPTIONS = '--loader ts-node/esm'

const env = {
  // Node.js environment variables
  NODE_ENV: process.env.NODE_ENV || null,
  NODE_OPTIONS: process.env.NODE_OPTIONS || null,
  TZ: process.env.TZ || null,

  // TypeScript environment variables
  SWCRC: process.env.SWCRC || null,
  TS_NODE_PROJECT: process.env.TS_NODE_PROJECT || null,

  // Custom environment variables
  APP_ENV: process.env.APP_ENV || null,
}

// eslint-disable-next-line no-console
console.log(styleText(
  'green',
  JSON.stringify(
    env,
    null,
    2,
  ),
))

// '--loader @swc-node/register/esm-register',
// REVIEW: In Github CI. Cannot use 'progress-bar' formatter for output to 'stdout' as not a TTY. Switching to 'progress' formatter.
// '--format progress-bar',
const common = []

export const app_backend = [
  ...common,
  'tests/apps/features/**/*.feature',
  '--import tests/apps/features/step_definitions/*.steps.ts',
].join(' ')

export default {
  app_backend,
}
