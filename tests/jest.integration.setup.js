/**
 * Jest Setup for Integration Tests (Node.js environment)
 * This setup file runs BEFORE module loading to ensure fetch polyfill is available
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require('undici')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const util = require('util')

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

// console.log('✓ Integration test setup: fetch polyfills configured')
