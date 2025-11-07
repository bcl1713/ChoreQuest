/**
 * Jest Setup for Integration Tests (Node.js environment)
 * This setup file is only run for integration tests to ensure proper fetch polyfill
 */

// Setup fetch for Node.js environment
if (typeof global !== 'undefined' && !global.fetch) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const undici = require('undici')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const util = require('util')

    global.fetch = undici.fetch
    global.Request = undici.Request
    global.Response = undici.Response
    global.TextEncoder = util.TextEncoder
    global.TextDecoder = util.TextDecoder
  } catch (error) {
    console.error('Failed to setup undici fetch:', error)
    throw error
  }
}
