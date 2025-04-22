import {
  randomString,
} from '/randomString.js'

export const randomState = {
  find(name = '', isCryptographically = false) {
    let value = globalThis.sessionStorage.getItem(name)
    if (!value) {
      // value = Math.random().toString(36).substring(7)
      value = isCryptographically
        ? randomString.generateCrypto(16)
        : randomString.generate(16)
      globalThis.sessionStorage.setItem(name, value)
    }
    return value
  },
  remove(name = '') {
    globalThis.sessionStorage.removeItem(name)
  },
}
