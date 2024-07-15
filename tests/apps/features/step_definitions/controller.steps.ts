import assert from 'node:assert/strict'

import {
  Then,
  When,
} from '@cucumber/cucumber'
import type {
  Response,
  Test,
} from 'supertest'

import {
  api,
} from './hooks.steps.js'

let request: Test
let response: Response

When('I send a GET request to {string}', (route: string) => {
  request = api.get(route)
})

Then('the response status code should be {int}', async (status: number) => {
  response = await request.expect(status)
})

When('I send a PUT request to {string} with body:', (route: string, body: string) => {
  request = api.put(route)
  request.send(JSON.parse(body))
})

Then('the response should be empty', () => {
  assert.deepStrictEqual(response.body, {})
})

Then('the response content should be:', (res) => {
  assert.deepStrictEqual(response.body, JSON.parse(res))
})
