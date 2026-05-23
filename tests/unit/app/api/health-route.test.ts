jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import packageJson from '@/package.json';
import { GET } from '@/app/api/health/route';
import { supabase } from '@/lib/supabase';

const originalNpmPackageVersion = process.env.npm_package_version;

describe('GET /api/health', () => {
  beforeEach(() => {
    const mockLimit = jest.fn().mockResolvedValue({ error: null });
    const mockSelect = jest.fn(() => ({ limit: mockLimit }));

    jest.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as never);

    delete process.env.npm_package_version;
  });

  afterEach(() => {
    jest.mocked(supabase.from).mockReset();
  });

  afterAll(() => {
    if (originalNpmPackageVersion === undefined) {
      delete process.env.npm_package_version;
    } else {
      process.env.npm_package_version = originalNpmPackageVersion;
    }
  });

  it('reports the tracked package version when npm_package_version is unavailable', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toBe(packageJson.version);
    expect(body.version).not.toBe('0.2.0');
  });
});
