import 'whatwg-fetch';
import '@testing-library/jest-dom'

// Only setup fetch polyfills for Node.js environment tests
if (typeof global !== 'undefined' && !global.fetch) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { fetch, Request, Response } = require('undici')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TextEncoder, TextDecoder } = require('util')

    global.fetch = fetch
    global.Request = Request
    global.Response = Response
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder
  } catch {
    // Silently ignore if undici is not available
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock framer-motion to avoid issues with animation testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// Setup global test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock WebSocket for real-time features
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1
    this.send = jest.fn()
    this.close = jest.fn()
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 100)
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.confirm and window.alert
global.confirm = jest.fn(() => true)
global.alert = jest.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});



jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends Request {
    constructor(input, init) {
      super(input, init);
      const url = new URL(input.toString());
      Object.defineProperty(this, 'nextUrl', {
        value: {
          searchParams: url.searchParams,
          pathname: url.pathname,
        },
        writable: true,
        configurable: true,
      });
    }
  },
  NextResponse: class MockNextResponse extends Response {
    static json(data, init) {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    }
  },
}));

/**
 * Console output suppression for cleaner test output
 *
 * NOTE: We suppress expected console output, not broken behavior:
 * - JSDOM limitations (unimplemented browser APIs) - safe to suppress
 * - Component error logs during error handling tests - correct behavior, just noisy
 * - React act() warnings from component cleanup/teardown - not actionable test issues
 *
 * Real errors and unexpected warnings will still be shown.
 */
const originalError = console.error
const originalWarn = console.warn
const originalLog = console.log

beforeAll(() => {
  // Suppress console.log - components use this for success messages
  console.log = jest.fn()

  console.error = (...args) => {
    const errorString = args.join(' ')

    // JSDOM limitations - browser APIs not implemented in test environment
    if (
      errorString.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      errorString.includes('Not implemented: HTMLCanvasElement.prototype.getContext') ||
      errorString.includes('Error: Could not parse CSS stylesheet')
    ) {
      return
    }

    // Component error logging during error handling tests
    // These are CORRECT behavior - components should log errors when they catch them
    // We test that error states render correctly, but don't need to see the logs
    if (
      errorString.includes('Failed to load') ||
      errorString.includes('Failed to regenerate') ||
      errorString.includes('Failed to update') ||
      errorString.includes('Failed to copy')
    ) {
      return
    }

    // React act() warnings during component cleanup/teardown in error tests
    // These occur when components clean up after intentional errors, not from missing awaits
    if (
      errorString.includes('An update to') &&
      errorString.includes('inside a test was not wrapped in act')
    ) {
      return
    }

    // Show all other errors - these indicate real problems
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    // Suppress React warnings we don't care about in tests
    const warnString = args.join(' ')
    if (
      warnString.includes('ReactDOM.render') ||
      warnString.includes('useLayoutEffect')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
  console.log = originalLog
})