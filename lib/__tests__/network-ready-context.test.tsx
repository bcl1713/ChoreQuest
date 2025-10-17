import React, { useLayoutEffect, useState } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { NetworkReadyProvider, useNetworkReady } from '../network-ready-context';

describe('NetworkReadyProvider', () => {
  const originalUserAgent = navigator.userAgent;
  const originalReadyState = document.readyState;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 Chrome/129.0.0.0 Mobile Safari/537.36',
      configurable: true,
    });

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });

    Object.defineProperty(document, 'readyState', {
      value: originalReadyState,
      configurable: true,
    });
  });

  it('keeps waitForReady pending until initialization finishes even when called before effects run', async () => {
    let waitPromise: Promise<void> | null = null;

    const TestComponent = () => {
      const { waitForReady } = useNetworkReady();
      const [ready, setReady] = useState(false);

      // useLayoutEffect runs before parent useEffect handlers, mimicking the
      // scenario where consumers call waitForReady() before the provider
      // initializes its network guards.
      useLayoutEffect(() => {
        waitPromise = waitForReady();
        waitPromise.then(() => setReady(true));
      }, [waitForReady]);

      return (
        <div data-testid="status">
          {ready ? 'ready' : 'pending'}
        </div>
      );
    };

    const { getByTestId } = render(
      <NetworkReadyProvider>
        <TestComponent />
      </NetworkReadyProvider>
    );

    expect(getByTestId('status').textContent).toBe('pending');
    expect(waitPromise).not.toBeNull();

    let resolved = false;
    waitPromise?.then(() => {
      resolved = true;
    });

    // Allow any immediate microtasks to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(resolved).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await act(async () => {
      await waitPromise;
    });

    expect(getByTestId('status').textContent).toBe('ready');
    expect(resolved).toBe(true);
  });
});
