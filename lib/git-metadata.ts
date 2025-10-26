import { readFileSync } from 'node:fs';
import path from 'node:path';

export type GitReferenceMetadata =
  | { type: 'branch'; value: string }
  | { type: 'tag'; value: string };

const normalizeRefValue = (value: string | undefined | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const stripPrefix = (value: string, prefixes: string[]) => {
  for (const prefix of prefixes) {
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }
  return value;
};

const firstNonEmpty = (values: Array<string | undefined | null>) => {
  for (const raw of values) {
    const normalized = normalizeRefValue(raw);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
};

const resolveTag = () => {
  const explicitTag = firstNonEmpty([
    process.env.NEXT_PUBLIC_GIT_TAG,
    process.env.GIT_TAG,
    process.env.VERCEL_GIT_COMMIT_TAG,
    process.env.CI_COMMIT_TAG,
    process.env.RENDER_GIT_TAG_NAME,
  ]);

  if (explicitTag) {
    return explicitTag;
  }

  const githubRefType = normalizeRefValue(process.env.GITHUB_REF_TYPE);
  const githubRefName = normalizeRefValue(process.env.GITHUB_REF_NAME);
  if (githubRefType === 'tag' && githubRefName) {
    return githubRefName;
  }

  const githubRef = normalizeRefValue(process.env.GITHUB_REF);
  if (githubRef && githubRef.startsWith('refs/tags/')) {
    return githubRef.slice('refs/tags/'.length);
  }

  return undefined;
};

const resolveBranch = () => {
  const explicitBranch = firstNonEmpty([
    process.env.NEXT_PUBLIC_GIT_BRANCH,
    process.env.NEXT_PUBLIC_GIT_REF,
    process.env.GIT_BRANCH,
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.BRANCH,
    process.env.CI_COMMIT_BRANCH,
    process.env.RENDER_GIT_BRANCH,
  ]);

  let branch = explicitBranch;

  const githubRefType = normalizeRefValue(process.env.GITHUB_REF_TYPE);
  const githubRefName = normalizeRefValue(process.env.GITHUB_REF_NAME);

  if (!branch && githubRefType === 'branch' && githubRefName) {
    branch = githubRefName;
  }

  if (!branch) {
    const githubRef = normalizeRefValue(process.env.GITHUB_REF);
    if (githubRef && githubRef.startsWith('refs/heads/')) {
      branch = githubRef.slice('refs/heads/'.length);
    }
  }

  if (!branch) {
    const githubRef = normalizeRefValue(process.env.GITHUB_REF);
    if (githubRef && githubRef.startsWith('refs/')) {
      branch = stripPrefix(githubRef, [
        'refs/heads/',
        'refs/remotes/origin/',
        'refs/remotes/',
        'refs/',
      ]);
    }
  }

  if (branch === 'HEAD') {
    return undefined;
  }

  return branch;
};

const shouldSkipLocalLookup = () =>
  normalizeRefValue(process.env.DISABLE_LOCAL_GIT_METADATA) === 'true' ||
  normalizeRefValue(process.env.NEXT_PUBLIC_DISABLE_LOCAL_GIT_METADATA) === 'true';

const resolveLocalGitReference = (): GitReferenceMetadata | null => {
  if (shouldSkipLocalLookup()) {
    return null;
  }

  try {
    const gitDir = normalizeRefValue(process.env.GIT_DIR) ?? path.join(process.cwd(), '.git');
    const headPath = path.join(gitDir, 'HEAD');
    const headContents = normalizeRefValue(readFileSync(headPath, 'utf8'));
    if (!headContents) {
      return null;
    }

    if (!headContents.startsWith('ref:')) {
      return null;
    }

    const ref = headContents.slice('ref:'.length).trim();
    if (!ref) {
      return null;
    }

    if (ref.startsWith('refs/heads/')) {
      return { type: 'branch', value: ref.slice('refs/heads/'.length) };
    }

    if (ref.startsWith('refs/tags/')) {
      return { type: 'tag', value: ref.slice('refs/tags/'.length) };
    }
  } catch {
    // Ignore failures; fall back to environment metadata only
    console.warn('git-metadata: unable to read local .git metadata; falling back to environment variables');
  }

  return null;
};

export const getGitReferenceMetadata = (): GitReferenceMetadata | null => {
  const tag = resolveTag();
  if (tag) {
    return { type: 'tag', value: tag };
  }

  const branch = resolveBranch();
  if (branch) {
    return { type: 'branch', value: branch };
  }

  const local = resolveLocalGitReference();
  if (local) {
    return local;
  }

  return null;
};
