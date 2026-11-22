import { Logger } from '@vtex/api/lib/service/logger/logger'

// @vtex/api's Logger races its log client against a 5 s timer it never clears, and one Logger is built
// as the package loads, so every command that loads it stayed alive 5 s after finishing. Running
// initLogClient with unref'd timers keeps the timeout without holding the process open.
export const unrefLogClientTimer = () => {
  // `initLogClient` is private in the typings.
  const prototype = (Logger.prototype as unknown) as { initLogClient: () => unknown }
  const { initLogClient } = prototype
  prototype.initLogClient = function initLogClientUnref() {
    const { setTimeout } = global
    global.setTimeout = ((handler: () => void, ms?: number) => setTimeout(handler, ms).unref()) as typeof setTimeout
    try {
      return initLogClient.call(this)
    } finally {
      global.setTimeout = setTimeout
    }
  }
}
