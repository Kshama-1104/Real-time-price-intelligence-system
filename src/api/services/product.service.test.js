jest.mock('../../database/pool', () => ({
  ping: jest.fn().mockResolvedValue(false),
  status: jest.fn().mockReturnValue({ connected: false }),
  close: jest.fn()
}));

jest.mock('../../cache/redis', () => ({
  getJson: jest.fn().mockResolvedValue(null),
  setJson: jest.fn().mockResolvedValue(true),
  deleteByPattern: jest.fn().mockResolvedValue(0),
  ping: jest.fn().mockResolvedValue(false),
  status: jest.fn().mockReturnValue({ connected: false }),
  close: jest.fn()
}));

const productService = require('./product.service');

describe('productService', () => {
  it('builds a dashboard from fallback product intelligence data', async () => {
    const dashboard = await productService.getDashboard();

    expect(dashboard.stats.trackedProducts).toBeGreaterThan(0);
    expect(dashboard.opportunities.length).toBeGreaterThan(0);
    expect(dashboard.categoryPerformance.length).toBeGreaterThan(0);
  });

  it('filters products by category', async () => {
    const result = await productService.list({ category: 'Audio', page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe('Audio');
  });
});
