declare global {
  declare module 'randomString.js' {
    interface randomString {
      generate: (length: number) => string
    }
  }
}
declare module 'randomString.js' {
  interface randomString {
    generate: (length: number) => string
  }
}
