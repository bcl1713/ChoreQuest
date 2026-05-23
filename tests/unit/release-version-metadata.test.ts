import packageJson from '@/package.json';
import packageLock from '@/package-lock.json';

describe('release version metadata', () => {
  it('keeps package-lock root metadata synchronized with package.json', () => {
    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages[''].version).toBe(packageJson.version);
  });

  it('automates lockfile metadata updates during npm version bumps', () => {
    expect(packageJson.scripts.version).toContain('npm install --package-lock-only');
    expect(packageJson.scripts.version).toContain('git add package-lock.json');
  });
});
