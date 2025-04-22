export const randomString = {
  /**
   *
   * @param {number} length
   */
  generate: (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    return randomString._generateString(length, characters)
  },
  /**
   *
   * @param {number} length
   */
  generateCrypto: (length) => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz+/'
    const randomValues = new Uint8Array(length)

    globalThis.crypto.getRandomValues(randomValues)

    return Array.from(randomValues)
      .map((value) => charset[value % charset.length])
      .join('')
  },

  /**
   *
   * @param {number} length
   * @param {string} characters
   */
  _generateString: (length, characters) => {
    let result = ''
    const charactersLength = characters.length

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }

    return result
  },
}
