export const hashParams = {
  parser(queryKey = '') {
    const hashParams = globalThis.location.hash.replace('#', '')?.split('&')

    if (queryKey) {
      return hashParams
        ?.find((param) => param.startsWith(queryKey))
        ?.split('=')
        ?.[1]
    }

    return hashParams
  },
  clearUrl() {
    globalThis.history.replaceState({}, globalThis.document.title, globalThis.location.href.split('#')?.[0])
  },
}
