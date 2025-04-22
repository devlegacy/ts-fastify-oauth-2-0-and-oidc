import {
  inspect,
} from 'node:util'

import pino,
{
  type Level,
  type LoggerOptions,
  type StreamEntry,
} from 'pino'
import {
  default as PinoPretty,
} from 'pino-pretty'

const MESSAGE_KEY = 'message'

const stream = PinoPretty({
  colorize: true, // colorizes the log
  colorizeObjects: true,
  destination: 1,
  ignore: 'pid,hostname',
  levelFirst: true,
  translateTime: 'yyyy-dd-mm, h:MM:ss TT',
  messageKey: MESSAGE_KEY,

})
const streams = (level: Level = 'info'): StreamEntry[] => [
  stream,
].map((stream) => ({
  stream,
  level,
}))

/**
 * Read more on: https://getpino.io/#/
 */
const logger = (options: LoggerOptions = {}) => pino.pino(
  {
    ...options,
    messageKey: MESSAGE_KEY,
    base: null,
  },
  pino.multistream(streams((options.level || 'info') as Level)),
)

const deepLog = <T = unknown>(data: T) =>
  logger().info(
    inspect(data, {
      showHidden: false,
      depth: null,
      colors: true,
    }),
  )

const info = logger().info.bind(logger())
const warn = logger().warn.bind(logger())
const debug = logger().debug.bind(logger())
const fatal = logger().fatal.bind(logger())
const error = logger().error.bind(logger())

export {
  debug,
  deepLog,
  error,
  fatal,
  info,
  logger,
  warn
}
