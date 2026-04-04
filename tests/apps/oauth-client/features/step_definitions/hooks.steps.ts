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
} from '#/src/apps/oauth-client/server.js'
import {
  config,
} from '#/src/Contexts/OauthClient/Shared/infrastructure/Config/config.js'
import {
  ONE_SECOND_IN_MILLISECONDS,
} from '#/src/Contexts/Shared/domain/time.js'

const application = new AppBackend(config)

let api: TestAgent<Test>
setDefaultTimeout(60 * ONE_SECOND_IN_MILLISECONDS)

BeforeAll(async () => {
  await application.start()
  api = supertest(application.httpServer!)
  await wait(ONE_SECOND_IN_MILLISECONDS)
})

AfterAll(async () => {
  await wait(ONE_SECOND_IN_MILLISECONDS)
  await application.stop()
})

export {
  api,
  application
}
