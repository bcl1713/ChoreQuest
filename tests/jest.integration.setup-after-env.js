/**
 * Jest Setup After Environment for Integration Tests
 * Runs after environment setup to suppress the --localstorage-file warning
 */

// Suppress the --localstorage-file warning that appears during jest cleanup
// This is a known issue with Node.js v20+ when jest-environment-node tries to clear
// the localStorage global after tests complete. The warning is harmless but noisy.
// See: https://github.com/nodejs/node/issues/49336
const originalEmitWarning = process.emitWarning
process.emitWarning = function(warning, ...args) {
  let warningStr = warning
  if (typeof warning === 'object' && warning.message) {
    warningStr = warning.message
  }
  if (typeof warningStr === 'string' && warningStr.includes('localstorage-file')) {
    return
  }
  return originalEmitWarning.apply(process, [warning, ...args])
}
