/**
 * Wrapper to run Node.js with @swc-node/register ESM hook.
 *
 * Workaround for Node.js 22+ test runner inheriting ESM hooks into worker threads:
 * @swc-node/register@1.11.1's oxc-resolver can't self-resolve pnpm-isolated packages
 * when the hook intercepts its own re-registration in worker threads.
 *
 * Fix: resolve the hook to an absolute file:// URL so the hook's special-case
 * for file: protocol skips custom resolution in inherited workers.
 *
 * Usage: node register-swc.mjs [node-args...] <entry>
 * Example: node register-swc.mjs --test ./tests/**\/*.test.ts
 */
import {
  execFileSync,
} from 'node:child_process'

const swcUrl = import.meta.resolve('@swc-node/register/esm-register')
execFileSync(process.execPath, [
  '--import',
  swcUrl,
  ...process.argv.slice(2),
], {
  stdio: 'inherit',
})
