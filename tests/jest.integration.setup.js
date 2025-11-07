/**
 * Jest Setup for Integration Tests (Node.js environment)
 * This setup file runs BEFORE module loading to ensure fetch polyfill is available
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require('undici')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const util = require('util')

// Suppress the --localstorage-file warning that appears during jest cleanup
// This is a known issue with Node.js v20+ when jest-environment-node tries to clear
// the localStorage global after tests complete. The warning is harmless but noisy.
// See: https://github.com/nodejs/node/issues/49336
const { emitWarning } = process
process.emitWarning = function(warning, ...args) {
  if (typeof warning === 'string' && warning.includes('localstorage-file')) {
    return
  }
  return emitWarning.apply(process, [warning, ...args])
}

// Set up global fetch BEFORE any modules try to use it
// Use both global and globalThis to be safe
global.fetch = undici.fetch
global.Request = undici.Request
global.Response = undici.Response
global.TextEncoder = util.TextEncoder
global.TextDecoder = util.TextDecoder

// Also set on globalThis for compatibility
globalThis.fetch = undici.fetch
globalThis.Request = undici.Request
globalThis.Response = undici.Response
globalThis.TextEncoder = util.TextEncoder
globalThis.TextDecoder = util.TextDecoder

// Setup localStorage for Supabase which needs it with persistSession: true
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// console.log('✓ Integration test setup: fetch polyfills configured')
