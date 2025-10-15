import { GET } from '@/app/api/test-route/route';

describe('Test API Route', () => {
  it('should return a success message', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Hello from test API!' });
  });
});
