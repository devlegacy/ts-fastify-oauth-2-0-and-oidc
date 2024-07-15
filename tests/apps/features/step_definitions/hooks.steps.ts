import {
  setTimeout as wait,
} from 'node:timers/promises'

import {
  AfterAll,
  BeforeAll,
  setDefaultTimeout,
} from '@cucumber/cucumber'
import type {
  Test,
} from 'supertest'
import supertest from 'supertest'
import type TestAgent from 'supertest/lib/agent.js'

import {
  AppBackend,
} from '#@/src/apps/server.js'
import {
  config,
} from '#@/src/Contexts/Shared/infrastructure/Config/config.js'

const application = new AppBackend(config)

let api: TestAgent<Test>
setDefaultTimeout(60 * 1000)

BeforeAll(async () => {
  await application.start()
  api = supertest(application.httpServer!)
  await wait(1000)
})

AfterAll(async () => {
  await wait(1000)
  await application.stop()
})

export {
  api,
  application
}
