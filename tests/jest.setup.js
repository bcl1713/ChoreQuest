import "whatwg-fetch";
import "@testing-library/jest-dom";

// Only setup fetch polyfills for Node.js environment tests
if (typeof global !== "undefined" && !global.fetch) {
  try {
    // Using require is necessary here for Jest setup - dynamic imports don't work in this context
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const undici = require("undici");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const util = require("util");

    global.fetch = undici.fetch;
    global.Request = undici.Request;
    global.Response = undici.Response;
    global.TextEncoder = util.TextEncoder;
    global.TextDecoder = util.TextDecoder;
  } catch {
    // Silently ignore if undici is not available
  }
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion to avoid issues with animation testing
jest.mock("framer-motion", () => ({
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
}));

// Setup global test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock WebSocket for real-time features
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.send = jest.fn();
    this.close = jest.fn();
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 100);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.confirm and window.alert
global.confirm = jest.fn(() => true);
global.alert = jest.fn();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest extends Request {
    constructor(input, init) {
      super(input, init);
      const url = new URL(input.toString());
      Object.defineProperty(this, "nextUrl", {
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
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
    }
  },
}));

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});
