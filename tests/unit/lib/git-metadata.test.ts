jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
}));

import { readFileSync } from 'node:fs';
import { getGitReferenceMetadata } from '@/lib/git-metadata';

const MANAGED_ENV_KEYS = [
  'NEXT_PUBLIC_GIT_TAG',
  'NEXT_PUBLIC_GIT_BRANCH',
  'NEXT_PUBLIC_GIT_REF',
  'GIT_TAG',
  'GIT_BRANCH',
  'VERCEL_GIT_COMMIT_REF',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_TAG',
  'BRANCH',
  'GITHUB_REF',
  'GITHUB_REF_TYPE',
  'GITHUB_REF_NAME',
  'CI_COMMIT_BRANCH',
  'CI_COMMIT_TAG',
  'RENDER_GIT_BRANCH',
  'RENDER_GIT_TAG_NAME',
  'DISABLE_LOCAL_GIT_METADATA',
  'NEXT_PUBLIC_DISABLE_LOCAL_GIT_METADATA',
  'GIT_DIR',
];

const clearManagedEnv = () => {
  for (const key of MANAGED_ENV_KEYS) {
    delete process.env[key];
  }
};

const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe('getGitReferenceMetadata', () => {
  beforeEach(() => {
    clearManagedEnv();
    process.env.DISABLE_LOCAL_GIT_METADATA = 'true';
    readFileSyncMock.mockImplementation(() => {
      throw new Error('readFileSync should not be used with local lookup disabled');
    });
  });

afterEach(() => {
  clearManagedEnv();
  readFileSyncMock.mockReset();
});

  it('prefers explicit tag when available', () => {
    process.env.NEXT_PUBLIC_GIT_TAG = 'v0.4.0';
    process.env.VERCEL_GIT_COMMIT_REF = 'develop';

    const result = getGitReferenceMetadata();

    expect(result).toEqual({ type: 'tag', value: 'v0.4.0' });
  });

  it('detects tag from GitHub ref format', () => {
    process.env.GITHUB_REF = 'refs/tags/release-2025-10-20';

    const result = getGitReferenceMetadata();

    expect(result).toEqual({ type: 'tag', value: 'release-2025-10-20' });
  });

  it('falls back to branch metadata when tag missing', () => {
    process.env.VERCEL_GIT_COMMIT_REF = 'feature/display-footer';

    const result = getGitReferenceMetadata();

    expect(result).toEqual({ type: 'branch', value: 'feature/display-footer' });
  });

  it('normalizes refs/heads prefix in branch metadata', () => {
    process.env.GITHUB_REF = 'refs/heads/hotfix/login-error';

    const result = getGitReferenceMetadata();

    expect(result).toEqual({ type: 'branch', value: 'hotfix/login-error' });
  });

  it('returns null when no git metadata exists', () => {
    const result = getGitReferenceMetadata();

    expect(result).toBeNull();
  });

  it('falls back to local git HEAD when env metadata missing', () => {
    delete process.env.DISABLE_LOCAL_GIT_METADATA;
    readFileSyncMock.mockReturnValue('ref: refs/heads/feature/local-testing');

    const result = getGitReferenceMetadata();

    expect(readFileSyncMock).toHaveBeenCalled();
    expect(result).toEqual({ type: 'branch', value: 'feature/local-testing' });
  });

  it('ignores local git errors gracefully', () => {
    delete process.env.DISABLE_LOCAL_GIT_METADATA;
    const warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    readFileSyncMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const result = getGitReferenceMetadata();

    expect(result).toBeNull();
    expect(warnMock).toHaveBeenCalled();
    warnMock.mockRestore();
  });
});
