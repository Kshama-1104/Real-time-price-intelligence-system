const now = new Date();
const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const products = [
  {
    id: 'prd-echo-buds',
    sku: 'AUD-1024',
    name: 'EchoBeat ANC Wireless Earbuds',
    category: 'Audio',
    brand: 'EchoBeat',
    channel: 'Marketplace',
    ourPrice: 129.99,
    cost: 72.5,
    targetMargin: 34,
    stock: 842,
    status: 'watch',
    updatedAt: hoursAgo(1),
    competitors: [
      { retailer: 'Amazon', price: 124.49, availability: 'In stock', rating: 4.5, updatedAt: hoursAgo(1) },
      { retailer: 'Flipkart', price: 132.99, availability: 'In stock', rating: 4.4, updatedAt: hoursAgo(2) },
      { retailer: 'Walmart', price: 127.25, availability: 'Limited', rating: 4.3, updatedAt: hoursAgo(3) }
    ],
    priceHistory: [
      { time: hoursAgo(24), ourPrice: 134.99, marketPrice: 131.2 },
      { time: hoursAgo(18), ourPrice: 134.99, marketPrice: 129.8 },
      { time: hoursAgo(12), ourPrice: 129.99, marketPrice: 127.9 },
      { time: hoursAgo(6), ourPrice: 129.99, marketPrice: 126.5 },
      { time: hoursAgo(1), ourPrice: 129.99, marketPrice: 124.49 }
    ]
  },
  {
    id: 'prd-smart-watch',
    sku: 'WCH-2091',
    name: 'PulsePro Smart Fitness Watch',
    category: 'Wearables',
    brand: 'PulsePro',
    channel: 'D2C',
    ourPrice: 219.0,
    cost: 121.75,
    targetMargin: 38,
    stock: 316,
    status: 'healthy',
    updatedAt: hoursAgo(2),
    competitors: [
      { retailer: 'Amazon', price: 229.5, availability: 'In stock', rating: 4.2, updatedAt: hoursAgo(2) },
      { retailer: 'Target', price: 224.99, availability: 'In stock', rating: 4.4, updatedAt: hoursAgo(5) },
      { retailer: 'Best Buy', price: 219.0, availability: 'In stock', rating: 4.1, updatedAt: hoursAgo(7) }
    ],
    priceHistory: [
      { time: hoursAgo(24), ourPrice: 224.0, marketPrice: 226.2 },
      { time: hoursAgo(18), ourPrice: 224.0, marketPrice: 226.8 },
      { time: hoursAgo(12), ourPrice: 219.0, marketPrice: 225.1 },
      { time: hoursAgo(6), ourPrice: 219.0, marketPrice: 222.4 },
      { time: hoursAgo(2), ourPrice: 219.0, marketPrice: 224.99 }
    ]
  },
  {
    id: 'prd-air-fryer',
    sku: 'KIT-8840',
    name: 'CrispFlow 6L Digital Air Fryer',
    category: 'Kitchen',
    brand: 'CrispFlow',
    channel: 'Retail',
    ourPrice: 89.95,
    cost: 54.4,
    targetMargin: 31,
    stock: 128,
    status: 'action',
    updatedAt: hoursAgo(0.5),
    competitors: [
      { retailer: 'Amazon', price: 79.99, availability: 'In stock', rating: 4.6, updatedAt: hoursAgo(0.5) },
      { retailer: 'Walmart', price: 84.0, availability: 'In stock', rating: 4.5, updatedAt: hoursAgo(3) },
      { retailer: 'Costco', price: 86.99, availability: 'Limited', rating: 4.3, updatedAt: hoursAgo(4) }
    ],
    priceHistory: [
      { time: hoursAgo(24), ourPrice: 92.95, marketPrice: 88.3 },
      { time: hoursAgo(18), ourPrice: 92.95, marketPrice: 86.4 },
      { time: hoursAgo(12), ourPrice: 89.95, marketPrice: 84.8 },
      { time: hoursAgo(6), ourPrice: 89.95, marketPrice: 81.9 },
      { time: hoursAgo(0.5), ourPrice: 89.95, marketPrice: 79.99 }
    ]
  },
  {
    id: 'prd-standing-desk',
    sku: 'HOM-7120',
    name: 'LiftLine Bamboo Standing Desk',
    category: 'Home Office',
    brand: 'LiftLine',
    channel: 'Marketplace',
    ourPrice: 399.0,
    cost: 241.25,
    targetMargin: 35,
    stock: 74,
    status: 'healthy',
    updatedAt: hoursAgo(4),
    competitors: [
      { retailer: 'Wayfair', price: 409.0, availability: 'In stock', rating: 4.7, updatedAt: hoursAgo(4) },
      { retailer: 'Amazon', price: 399.0, availability: 'In stock', rating: 4.5, updatedAt: hoursAgo(4) },
      { retailer: 'Ikea', price: 429.0, availability: 'Backorder', rating: 4.1, updatedAt: hoursAgo(12) }
    ],
    priceHistory: [
      { time: hoursAgo(24), ourPrice: 399.0, marketPrice: 415.2 },
      { time: hoursAgo(18), ourPrice: 399.0, marketPrice: 412.8 },
      { time: hoursAgo(12), ourPrice: 399.0, marketPrice: 409.0 },
      { time: hoursAgo(6), ourPrice: 399.0, marketPrice: 409.0 },
      { time: hoursAgo(4), ourPrice: 399.0, marketPrice: 399.0 }
    ]
  },
  {
    id: 'prd-power-bank',
    sku: 'ACC-3308',
    name: 'VoltEdge 20K Fast Charge Power Bank',
    category: 'Accessories',
    brand: 'VoltEdge',
    channel: 'D2C',
    ourPrice: 49.99,
    cost: 24.3,
    targetMargin: 42,
    stock: 1128,
    status: 'opportunity',
    updatedAt: hoursAgo(1.5),
    competitors: [
      { retailer: 'Amazon', price: 56.99, availability: 'In stock', rating: 4.4, updatedAt: hoursAgo(1.5) },
      { retailer: 'Walmart', price: 54.49, availability: 'In stock', rating: 4.2, updatedAt: hoursAgo(6) },
      { retailer: 'Target', price: 57.0, availability: 'In stock', rating: 4.2, updatedAt: hoursAgo(8) }
    ],
    priceHistory: [
      { time: hoursAgo(24), ourPrice: 47.99, marketPrice: 51.4 },
      { time: hoursAgo(18), ourPrice: 47.99, marketPrice: 52.8 },
      { time: hoursAgo(12), ourPrice: 49.99, marketPrice: 54.1 },
      { time: hoursAgo(6), ourPrice: 49.99, marketPrice: 54.49 },
      { time: hoursAgo(1.5), ourPrice: 49.99, marketPrice: 56.99 }
    ]
  }
];

const alerts = [
  {
    id: 'alt-1001',
    severity: 'high',
    productId: 'prd-air-fryer',
    title: 'Competitor undercut exceeds 10%',
    message: 'Amazon moved 11.1% below our current air fryer price.',
    createdAt: hoursAgo(0.5),
    status: 'open'
  },
  {
    id: 'alt-1002',
    severity: 'medium',
    productId: 'prd-echo-buds',
    title: 'Margin pressure detected',
    message: 'Lowest market price is below the recommended protection band.',
    createdAt: hoursAgo(1),
    status: 'investigating'
  },
  {
    id: 'alt-1003',
    severity: 'low',
    productId: 'prd-power-bank',
    title: 'Pricing upside available',
    message: 'Market is pricing 12% above us while inventory is healthy.',
    createdAt: hoursAgo(1.5),
    status: 'open'
  }
];

module.exports = {
  products,
  alerts
};
