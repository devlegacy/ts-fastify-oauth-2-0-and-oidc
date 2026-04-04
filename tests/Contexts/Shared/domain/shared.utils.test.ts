import assert from 'node:assert/strict'
import {
  describe,
  it,
} from 'node:test'
import {
  setTimeout as wait,
} from 'node:timers/promises'

import {
  isNil,
  isString,
  isUndefined,
} from '#/src/Contexts/Shared/domain/shared.utils.js'

describe('Shared utils', () => {
  it('should return true when the value is null for isNil', () => {
    assert.strictEqual(isNil(null), true)
  })

  it('should return true when the value is undefined for isNil', () => {
    assert.strictEqual(isNil(undefined), true)
  })

  it('should return true when the value is undefined for isUndefined', () => {
    assert.strictEqual(isUndefined(undefined), true)
  })

  it('should return true when the value is a string for isString', async () => {
    await wait(500)
    assert.strictEqual(isString('string value'), true)
  })
})
