CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) PRIMARY KEY,
  sku VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  channel VARCHAR(40) NOT NULL DEFAULT 'Marketplace',
  our_price NUMERIC(12, 2) NOT NULL CHECK (our_price > 0),
  cost NUMERIC(12, 2) NOT NULL CHECK (cost > 0),
  target_margin NUMERIC(5, 2) NOT NULL DEFAULT 35,
  stock INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'watch',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TABLE IF NOT EXISTS price_observations (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(80) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  retailer VARCHAR(80) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  availability VARCHAR(80) NOT NULL DEFAULT 'In stock',
  rating NUMERIC(3, 1) NOT NULL DEFAULT 4,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_observations_product ON price_observations(product_id);
CREATE INDEX IF NOT EXISTS idx_price_observations_retailer ON price_observations(retailer);
CREATE INDEX IF NOT EXISTS idx_price_observations_observed_at ON price_observations(observed_at DESC);

CREATE TABLE IF NOT EXISTS alert_rules (
  id VARCHAR(80) PRIMARY KEY,
  severity VARCHAR(16) NOT NULL,
  product_id VARCHAR(80) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO products (id, sku, name, category, brand, channel, our_price, cost, target_margin, stock, status)
VALUES
  ('prd-echo-buds', 'AUD-1024', 'EchoBeat ANC Wireless Earbuds', 'Audio', 'EchoBeat', 'Marketplace', 129.99, 72.50, 34, 842, 'watch'),
  ('prd-smart-watch', 'WCH-2091', 'PulsePro Smart Fitness Watch', 'Wearables', 'PulsePro', 'D2C', 219.00, 121.75, 38, 316, 'healthy'),
  ('prd-air-fryer', 'KIT-8840', 'CrispFlow 6L Digital Air Fryer', 'Kitchen', 'CrispFlow', 'Retail', 89.95, 54.40, 31, 128, 'action'),
  ('prd-standing-desk', 'HOM-7120', 'LiftLine Bamboo Standing Desk', 'Home Office', 'LiftLine', 'Marketplace', 399.00, 241.25, 35, 74, 'healthy'),
  ('prd-power-bank', 'ACC-3308', 'VoltEdge 20K Fast Charge Power Bank', 'Accessories', 'VoltEdge', 'D2C', 49.99, 24.30, 42, 1128, 'opportunity')
ON CONFLICT (id) DO NOTHING;

INSERT INTO price_observations (product_id, retailer, price, availability, rating, observed_at)
VALUES
  ('prd-echo-buds', 'Amazon', 124.49, 'In stock', 4.5, NOW() - INTERVAL '1 hour'),
  ('prd-echo-buds', 'Flipkart', 132.99, 'In stock', 4.4, NOW() - INTERVAL '2 hours'),
  ('prd-echo-buds', 'Walmart', 127.25, 'Limited', 4.3, NOW() - INTERVAL '3 hours'),
  ('prd-smart-watch', 'Amazon', 229.50, 'In stock', 4.2, NOW() - INTERVAL '2 hours'),
  ('prd-smart-watch', 'Target', 224.99, 'In stock', 4.4, NOW() - INTERVAL '5 hours'),
  ('prd-smart-watch', 'Best Buy', 219.00, 'In stock', 4.1, NOW() - INTERVAL '7 hours'),
  ('prd-air-fryer', 'Amazon', 79.99, 'In stock', 4.6, NOW() - INTERVAL '30 minutes'),
  ('prd-air-fryer', 'Walmart', 84.00, 'In stock', 4.5, NOW() - INTERVAL '3 hours'),
  ('prd-air-fryer', 'Costco', 86.99, 'Limited', 4.3, NOW() - INTERVAL '4 hours'),
  ('prd-standing-desk', 'Wayfair', 409.00, 'In stock', 4.7, NOW() - INTERVAL '4 hours'),
  ('prd-standing-desk', 'Amazon', 399.00, 'In stock', 4.5, NOW() - INTERVAL '4 hours'),
  ('prd-standing-desk', 'Ikea', 429.00, 'Backorder', 4.1, NOW() - INTERVAL '12 hours'),
  ('prd-power-bank', 'Amazon', 56.99, 'In stock', 4.4, NOW() - INTERVAL '90 minutes'),
  ('prd-power-bank', 'Walmart', 54.49, 'In stock', 4.2, NOW() - INTERVAL '6 hours'),
  ('prd-power-bank', 'Target', 57.00, 'In stock', 4.2, NOW() - INTERVAL '8 hours');

INSERT INTO alert_rules (id, severity, product_id, title, message, status, created_at)
VALUES
  ('alt-1001', 'high', 'prd-air-fryer', 'Competitor undercut exceeds 10%', 'Amazon moved 11.1% below our current air fryer price.', 'open', NOW() - INTERVAL '30 minutes'),
  ('alt-1002', 'medium', 'prd-echo-buds', 'Margin pressure detected', 'Lowest market price is below the recommended protection band.', 'investigating', NOW() - INTERVAL '1 hour'),
  ('alt-1003', 'low', 'prd-power-bank', 'Pricing upside available', 'Market is pricing 12% above us while inventory is healthy.', 'open', NOW() - INTERVAL '90 minutes')
ON CONFLICT (id) DO NOTHING;
