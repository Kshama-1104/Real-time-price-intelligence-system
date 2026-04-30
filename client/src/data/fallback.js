export const fallbackDashboard = {
  generatedAt: new Date().toISOString(),
  stats: {
    trackedProducts: 5,
    competitors: 9,
    activeAlerts: 3,
    atRiskSkus: 2,
    averageMargin: 41.1,
    priceChanges24h: 4
  },
  trend: [
    { label: '24h', ourIndex: 179.59, marketIndex: 182.46 },
    { label: '18h', ourIndex: 179.59, marketIndex: 181.72 },
    { label: '12h', ourIndex: 177.38, marketIndex: 180.18 },
    { label: '6h', ourIndex: 177.38, marketIndex: 178.65 },
    { label: 'Now', ourIndex: 177.38, marketIndex: 176.29 }
  ],
  categoryPerformance: [
    { category: 'Audio', products: 1, avgSpread: 4.2, avgMargin: 44.2 },
    { category: 'Wearables', products: 1, avgSpread: 0, avgMargin: 44.4 },
    { category: 'Kitchen', products: 1, avgSpread: 11.1, avgMargin: 39.5 },
    { category: 'Home Office', products: 1, avgSpread: 0, avgMargin: 39.5 },
    { category: 'Accessories', products: 1, avgSpread: -14, avgMargin: 51.4 }
  ],
  opportunities: [
    {
      productId: 'prd-power-bank',
      sku: 'ACC-3308',
      name: 'VoltEdge 20K Fast Charge Power Bank',
      category: 'Accessories',
      ourPrice: 49.99,
      suggestedPrice: 55.99,
      margin: 51.4,
      spreadPercent: -14,
      action: 'Lift margin',
      confidence: 92,
      lowestCompetitor: { retailer: 'Walmart', price: 54.49 }
    },
    {
      productId: 'prd-air-fryer',
      sku: 'KIT-8840',
      name: 'CrispFlow 6L Digital Air Fryer',
      category: 'Kitchen',
      ourPrice: 89.95,
      suggestedPrice: 79.36,
      margin: 39.5,
      spreadPercent: 11.1,
      action: 'Protect rank',
      confidence: 92,
      lowestCompetitor: { retailer: 'Amazon', price: 79.99 }
    }
  ],
  alerts: [
    {
      id: 'alt-1001',
      severity: 'high',
      productId: 'prd-air-fryer',
      title: 'Competitor undercut exceeds 10%',
      message: 'Amazon moved 11.1% below our current air fryer price.',
      createdAt: new Date().toISOString(),
      status: 'open'
    },
    {
      id: 'alt-1002',
      severity: 'medium',
      productId: 'prd-echo-buds',
      title: 'Margin pressure detected',
      message: 'Lowest market price is below the recommended protection band.',
      createdAt: new Date().toISOString(),
      status: 'investigating'
    }
  ]
};

export const fallbackProducts = {
  items: [
    {
      id: 'prd-echo-buds',
      sku: 'AUD-1024',
      name: 'EchoBeat ANC Wireless Earbuds',
      category: 'Audio',
      brand: 'EchoBeat',
      channel: 'Marketplace',
      ourPrice: 129.99,
      margin: 44.2,
      spreadPercent: 4.2,
      status: 'watch',
      stock: 842,
      lowestCompetitor: { retailer: 'Amazon', price: 124.49 }
    },
    {
      id: 'prd-smart-watch',
      sku: 'WCH-2091',
      name: 'PulsePro Smart Fitness Watch',
      category: 'Wearables',
      brand: 'PulsePro',
      channel: 'D2C',
      ourPrice: 219,
      margin: 44.4,
      spreadPercent: 0,
      status: 'healthy',
      stock: 316,
      lowestCompetitor: { retailer: 'Best Buy', price: 219 }
    },
    {
      id: 'prd-air-fryer',
      sku: 'KIT-8840',
      name: 'CrispFlow 6L Digital Air Fryer',
      category: 'Kitchen',
      brand: 'CrispFlow',
      channel: 'Retail',
      ourPrice: 89.95,
      margin: 39.5,
      spreadPercent: 11.1,
      status: 'action',
      stock: 128,
      lowestCompetitor: { retailer: 'Amazon', price: 79.99 }
    },
    {
      id: 'prd-power-bank',
      sku: 'ACC-3308',
      name: 'VoltEdge 20K Fast Charge Power Bank',
      category: 'Accessories',
      brand: 'VoltEdge',
      channel: 'D2C',
      ourPrice: 49.99,
      margin: 51.4,
      spreadPercent: -14,
      status: 'opportunity',
      stock: 1128,
      lowestCompetitor: { retailer: 'Walmart', price: 54.49 }
    }
  ],
  total: 4,
  page: 1,
  limit: 50,
  categories: ['Accessories', 'Audio', 'Kitchen', 'Wearables']
};
