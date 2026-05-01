ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id VARCHAR(80) NOT NULL DEFAULT 'org-pricepulse-demo';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_organization_sku ON products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);

ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS organization_id VARCHAR(80);
UPDATE alert_rules
SET organization_id = COALESCE(
  (
    SELECT products.organization_id
    FROM products
    WHERE products.id = alert_rules.product_id
  ),
  'org-pricepulse-demo'
)
WHERE organization_id IS NULL;
ALTER TABLE alert_rules ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alert_rules_organization ON alert_rules(organization_id);
