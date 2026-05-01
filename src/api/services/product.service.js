const { randomUUID } = require('crypto');
const env = require('../../config/env');
const db = require('../../database/pool');
const cache = require('../../cache/redis');
const logger = require('../../core/logger');
const seedData = require('../../data/seed-data');

const DEMO_ORG_ID = 'org-pricepulse-demo';

const clone = (value) => JSON.parse(JSON.stringify(value));
const withDemoOrg = (item) => ({ ...item, organizationId: item.organizationId || DEMO_ORG_ID });
const memoryProducts = clone(seedData.products).map(withDemoOrg);
const memoryAlerts = clone(seedData.alerts).map(withDemoOrg);

const toNumber = (value) => Number.parseFloat(value || 0);

const getWorkspace = (user) => ({
  organizationId: user?.organizationId || DEMO_ORG_ID
});

const isFilterPayload = (value) => value
  && typeof value === 'object'
  && !value.organizationId
  && !value.role
  && ['search', 'category', 'status', 'page', 'limit'].some((key) => Object.prototype.hasOwnProperty.call(value, key));

const splitListArgs = (userOrFilters, maybeFilters) => {
  if (isFilterPayload(userOrFilters) && maybeFilters === undefined) {
    return { user: null, filters: userOrFilters };
  }
  return { user: userOrFilters || null, filters: maybeFilters || {} };
};

const serviceUnavailable = () => {
  const error = new Error('Your workspace data is temporarily unavailable. Please try again in a moment.');
  error.statusCode = 503;
  return error;
};

const getLowestCompetitor = (product) => {
  if (!product.competitors || product.competitors.length === 0) {
    return null;
  }

  return product.competitors.reduce((lowest, competitor) => {
    if (!lowest || competitor.price < lowest.price) {
      return competitor;
    }
    return lowest;
  }, null);
};

const enrichProduct = (product) => {
  const lowestCompetitor = getLowestCompetitor(product);
  const margin = product.ourPrice > 0 ? ((product.ourPrice - product.cost) / product.ourPrice) * 100 : 0;
  const spreadPercent = lowestCompetitor
    ? ((product.ourPrice - lowestCompetitor.price) / product.ourPrice) * 100
    : 0;
  const floorPrice = product.cost / (1 - product.targetMargin / 100);
  const recommendedPrice = lowestCompetitor
    ? Math.max(floorPrice, lowestCompetitor.price + 0.5)
    : floorPrice;

  return {
    ...product,
    margin: Number(margin.toFixed(1)),
    spreadPercent: Number(spreadPercent.toFixed(1)),
    lowestCompetitor,
    recommendedPrice: Number(recommendedPrice.toFixed(2))
  };
};

const filterProducts = (products, filters = {}) => {
  const search = (filters.search || '').toLowerCase();
  const category = filters.category || '';
  const status = filters.status || '';

  return products.filter((product) => {
    const matchesSearch = !search
      || product.name.toLowerCase().includes(search)
      || product.sku.toLowerCase().includes(search)
      || product.brand.toLowerCase().includes(search);
    const matchesCategory = !category || product.category === category;
    const matchesStatus = !status || product.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });
};

const mapProductRow = (row, observations = []) => {
  const latestByRetailer = new Map();

  observations.forEach((observation) => {
    const previous = latestByRetailer.get(observation.retailer);
    if (!previous || new Date(observation.observed_at) > new Date(previous.observed_at)) {
      latestByRetailer.set(observation.retailer, observation);
    }
  });

  return {
    id: row.id,
    organizationId: row.organization_id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    brand: row.brand,
    channel: row.channel,
    ourPrice: toNumber(row.our_price),
    cost: toNumber(row.cost),
    targetMargin: toNumber(row.target_margin),
    stock: Number(row.stock),
    status: row.status,
    updatedAt: row.updated_at,
    competitors: Array.from(latestByRetailer.values()).map((observation) => ({
      retailer: observation.retailer,
      price: toNumber(observation.price),
      availability: observation.availability,
      rating: toNumber(observation.rating),
      updatedAt: observation.observed_at
    })),
    priceHistory: observations.slice(-12).map((observation) => ({
      time: observation.observed_at,
      ourPrice: toNumber(row.our_price),
      marketPrice: toNumber(observation.price)
    }))
  };
};

class ProductService {
  async ensureDataStore() {
    const online = await db.ping();
    if (online) {
      return true;
    }

    if (env.nodeEnv === 'production' || !env.features.allowDemoData) {
      throw serviceUnavailable();
    }

    return false;
  }

  async loadProducts(user) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    if (!online) {
      return memoryProducts
        .filter((product) => product.organizationId === organizationId)
        .map(enrichProduct);
    }

    try {
      const productResult = await db.query(`
        SELECT id, organization_id, sku, name, category, brand, channel, our_price, cost, target_margin, stock, status, updated_at
        FROM products
        WHERE organization_id = $1
        ORDER BY updated_at DESC
      `, [organizationId]);

      if (productResult.rows.length === 0) {
        return [];
      }

      const productIds = productResult.rows.map((product) => product.id);
      const observationResult = await db.query(`
        SELECT product_id, retailer, price, availability, rating, observed_at
        FROM price_observations
        WHERE product_id = ANY($1)
        ORDER BY observed_at ASC
      `, [productIds]);

      const observationsByProduct = observationResult.rows.reduce((groups, observation) => {
        groups[observation.product_id] = groups[observation.product_id] || [];
        groups[observation.product_id].push(observation);
        return groups;
      }, {});

      return productResult.rows
        .map((row) => mapProductRow(row, observationsByProduct[row.id] || []))
        .map(enrichProduct);
    } catch (error) {
      logger.error(`Unable to load workspace products: ${error.message}`);
      throw serviceUnavailable();
    }
  }

  async loadAlerts(user) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    if (!online) {
      return clone(memoryAlerts).filter((alert) => alert.organizationId === organizationId);
    }

    try {
      const result = await db.query(`
        SELECT id, severity, product_id AS "productId", organization_id AS "organizationId", title, message, status, created_at AS "createdAt"
        FROM alert_rules
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT 25
      `, [organizationId]);

      return result.rows;
    } catch (error) {
      logger.error(`Unable to load workspace alerts: ${error.message}`);
      throw serviceUnavailable();
    }
  }

  async getDashboard(user) {
    const { organizationId } = getWorkspace(user);
    const cacheKey = `price-intelligence:dashboard:${organizationId}`;
    const cached = await cache.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.loadProducts(user);
    const alerts = await this.loadAlerts(user);
    const dashboard = this.buildDashboard(products, alerts);
    await cache.setJson(cacheKey, dashboard);
    return dashboard;
  }

  buildDashboard(products, alerts) {
    const competitorNames = new Set();
    const margins = [];
    const trendBuckets = ['24h', '18h', '12h', '6h', 'Now'];
    const trend = trendBuckets.map((label, index) => {
      const points = products
        .map((product) => product.priceHistory[index])
        .filter(Boolean);
      const ourAverage = points.reduce((sum, point) => sum + point.ourPrice, 0) / (points.length || 1);
      const marketAverage = points.reduce((sum, point) => sum + point.marketPrice, 0) / (points.length || 1);

      return {
        label,
        ourIndex: Number(ourAverage.toFixed(2)),
        marketIndex: Number(marketAverage.toFixed(2))
      };
    });

    products.forEach((product) => {
      product.competitors.forEach((competitor) => competitorNames.add(competitor.retailer));
      margins.push(product.margin);
    });

    const categoryMap = products.reduce((groups, product) => {
      groups[product.category] = groups[product.category] || [];
      groups[product.category].push(product);
      return groups;
    }, {});

    const categoryPerformance = Object.entries(categoryMap).map(([category, items]) => ({
      category,
      products: items.length,
      avgSpread: Number((items.reduce((sum, item) => sum + item.spreadPercent, 0) / items.length).toFixed(1)),
      avgMargin: Number((items.reduce((sum, item) => sum + item.margin, 0) / items.length).toFixed(1))
    }));

    const opportunities = products
      .filter((product) => product.lowestCompetitor)
      .map((product) => {
        const undercutRisk = product.spreadPercent > 6;
        const pricingUpside = product.spreadPercent < -8;

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          ourPrice: product.ourPrice,
          lowestCompetitor: product.lowestCompetitor,
          suggestedPrice: pricingUpside
            ? Number(Math.min(product.lowestCompetitor.price - 1, product.ourPrice * 1.08).toFixed(2))
            : product.recommendedPrice,
          margin: product.margin,
          spreadPercent: product.spreadPercent,
          action: undercutRisk ? 'Protect rank' : pricingUpside ? 'Lift margin' : 'Hold band',
          confidence: undercutRisk || pricingUpside ? 92 : 78
        };
      })
      .sort((a, b) => Math.abs(b.spreadPercent) - Math.abs(a.spreadPercent))
      .slice(0, 5);

    return {
      generatedAt: new Date().toISOString(),
      stats: {
        trackedProducts: products.length,
        competitors: competitorNames.size,
        activeAlerts: alerts.filter((alert) => alert.status !== 'closed').length,
        atRiskSkus: products.filter((product) => ['action', 'watch'].includes(product.status)).length,
        averageMargin: Number((margins.reduce((sum, margin) => sum + margin, 0) / (margins.length || 1)).toFixed(1)),
        priceChanges24h: products.filter((product) => {
          const first = product.priceHistory[0];
          const last = product.priceHistory[product.priceHistory.length - 1];
          return first && last && Math.abs(first.marketPrice - last.marketPrice) > 1;
        }).length
      },
      trend,
      categoryPerformance,
      opportunities,
      alerts: alerts.slice(0, 5)
    };
  }

  async list(userOrFilters, maybeFilters) {
    const { user, filters } = splitListArgs(userOrFilters, maybeFilters);
    const products = await this.loadProducts(user);
    const filtered = filterProducts(products, filters);
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    const categories = Array.from(new Set(products.map((product) => product.category))).sort();

    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      categories
    };
  }

  async getById(userOrId, maybeId) {
    const user = maybeId === undefined ? null : userOrId;
    const id = maybeId === undefined ? userOrId : maybeId;
    const products = await this.loadProducts(user);
    return products.find((product) => product.id === id || product.sku === id) || null;
  }

  async create(user, payload) {
    const { organizationId } = getWorkspace(user);
    const product = {
      id: `prd-${randomUUID()}`,
      organizationId,
      ...payload,
      competitors: [],
      priceHistory: [],
      updatedAt: new Date().toISOString()
    };

    const online = await this.ensureDataStore();
    if (online) {
      try {
        await db.query(`
          INSERT INTO products (id, organization_id, sku, name, category, brand, channel, our_price, cost, target_margin, stock, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          product.id,
          product.organizationId,
          product.sku,
          product.name,
          product.category,
          product.brand,
          product.channel,
          product.ourPrice,
          product.cost,
          product.targetMargin,
          product.stock,
          product.status
        ]);
      } catch (error) {
        if (error.code === '23505') {
          error.message = 'A product with this SKU already exists in your workspace';
          error.statusCode = 409;
        }
        throw error;
      }
    } else {
      memoryProducts.unshift(product);
    }

    await cache.deleteByPattern('price-intelligence:*');
    return enrichProduct(product);
  }

  async update(user, productId, payload) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    const current = await this.getById(user, productId);
    if (!current) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (online) {
      const updated = { ...current, ...payload, updatedAt: new Date().toISOString() };
      await db.query(`
        UPDATE products
        SET sku = $3,
            name = $4,
            category = $5,
            brand = $6,
            channel = $7,
            our_price = $8,
            cost = $9,
            target_margin = $10,
            stock = $11,
            status = $12,
            updated_at = NOW()
        WHERE id = $1 AND organization_id = $2
      `, [
        current.id,
        organizationId,
        updated.sku,
        updated.name,
        updated.category,
        updated.brand,
        updated.channel,
        updated.ourPrice,
        updated.cost,
        updated.targetMargin,
        updated.stock,
        updated.status
      ]);
      await cache.deleteByPattern('price-intelligence:*');
      return this.getById(user, current.id);
    }

    const index = memoryProducts.findIndex((item) => item.organizationId === organizationId && (item.id === productId || item.sku === productId));
    memoryProducts[index] = {
      ...memoryProducts[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };

    await cache.deleteByPattern('price-intelligence:*');
    return enrichProduct(memoryProducts[index]);
  }

  async delete(user, productId) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    const current = await this.getById(user, productId);
    if (!current) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (online) {
      await db.query('DELETE FROM products WHERE id = $1 AND organization_id = $2', [current.id, organizationId]);
      await cache.deleteByPattern('price-intelligence:*');
      return true;
    }

    const index = memoryProducts.findIndex((item) => item.organizationId === organizationId && (item.id === productId || item.sku === productId));
    memoryProducts.splice(index, 1);
    await cache.deleteByPattern('price-intelligence:*');
    return true;
  }

  async recordPriceObservation(user, productId, payload) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    const product = await this.getById(user, productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (online) {
      await db.query(`
        INSERT INTO price_observations (product_id, retailer, price, availability, rating, observed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        product.id,
        payload.retailer,
        payload.price,
        payload.availability,
        payload.rating,
        payload.observedAt
      ]);
    } else {
      const memoryProduct = memoryProducts.find((item) => item.organizationId === organizationId && item.id === product.id);
      const observedAt = payload.observedAt instanceof Date ? payload.observedAt.toISOString() : payload.observedAt;
      memoryProduct.competitors = memoryProduct.competitors.filter((item) => item.retailer !== payload.retailer);
      memoryProduct.competitors.push({
        retailer: payload.retailer,
        price: payload.price,
        availability: payload.availability,
        rating: payload.rating,
        updatedAt: observedAt
      });
      memoryProduct.priceHistory.push({
        time: observedAt,
        ourPrice: memoryProduct.ourPrice,
        marketPrice: payload.price
      });
      memoryProduct.updatedAt = new Date().toISOString();
    }

    await cache.deleteByPattern('price-intelligence:*');
    const updatedProduct = await this.getById(user, product.id);
    await this.syncAlertForProduct(user, updatedProduct);
    await cache.deleteByPattern('price-intelligence:*');
    return this.getById(user, product.id);
  }

  async syncAlertForProduct(user, product) {
    if (!product?.lowestCompetitor) {
      return null;
    }

    const { organizationId } = getWorkspace(user);
    const undercutRisk = product.spreadPercent > 6;
    const pricingUpside = product.spreadPercent < -8;
    if (!undercutRisk && !pricingUpside) {
      return null;
    }

    const alert = {
      id: `alt-${product.id}`,
      organizationId,
      severity: Math.abs(product.spreadPercent) > 10 ? 'high' : 'medium',
      productId: product.id,
      title: undercutRisk ? 'Competitor undercut needs review' : 'Margin upside available',
      message: undercutRisk
        ? `${product.lowestCompetitor.retailer} is ${Math.abs(product.spreadPercent).toFixed(1)}% below your current price for ${product.sku}.`
        : `The market is ${Math.abs(product.spreadPercent).toFixed(1)}% above your current price for ${product.sku}.`,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    const online = await this.ensureDataStore();
    if (online) {
      await db.query(`
        INSERT INTO alert_rules (id, severity, product_id, organization_id, title, message, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'open', NOW())
        ON CONFLICT (id) DO UPDATE
        SET severity = EXCLUDED.severity,
            title = EXCLUDED.title,
            message = EXCLUDED.message,
            status = CASE WHEN alert_rules.status = 'closed' THEN 'open' ELSE alert_rules.status END,
            created_at = NOW()
      `, [
        alert.id,
        alert.severity,
        alert.productId,
        alert.organizationId,
        alert.title,
        alert.message
      ]);
      return alert;
    }

    const existingIndex = memoryAlerts.findIndex((item) => item.id === alert.id && item.organizationId === organizationId);
    if (existingIndex >= 0) {
      memoryAlerts[existingIndex] = {
        ...memoryAlerts[existingIndex],
        ...alert,
        status: memoryAlerts[existingIndex].status === 'closed' ? 'open' : memoryAlerts[existingIndex].status
      };
    } else {
      memoryAlerts.unshift(alert);
    }

    return alert;
  }

  async listAlerts(user) {
    return this.loadAlerts(user);
  }

  async updateAlert(user, alertId, payload) {
    const { organizationId } = getWorkspace(user);
    const online = await this.ensureDataStore();
    if (online) {
      const result = await db.query(
        'UPDATE alert_rules SET status = $3 WHERE id = $1 AND organization_id = $2 RETURNING id',
        [alertId, organizationId, payload.status]
      );
      if (result.rowCount === 0) {
        const error = new Error('Alert not found');
        error.statusCode = 404;
        throw error;
      }
    } else {
      const alert = memoryAlerts.find((item) => item.organizationId === organizationId && item.id === alertId);
      if (!alert) {
        const error = new Error('Alert not found');
        error.statusCode = 404;
        throw error;
      }
      alert.status = payload.status;
    }

    await cache.deleteByPattern('price-intelligence:*');
    return this.loadAlerts(user);
  }

  async report(user) {
    const dashboard = await this.getDashboard(user);
    const products = await this.loadProducts(user);
    const alerts = await this.loadAlerts(user);

    const atRisk = products.filter((product) => ['watch', 'action'].includes(product.status));
    const upside = products.filter((product) => product.status === 'opportunity');

    return {
      generatedAt: new Date().toISOString(),
      executiveSummary: {
        headline: products.length === 0
          ? 'Add your first product to generate pricing recommendations.'
          : `${atRisk.length} products need pricing attention and ${upside.length} have margin upside.`,
        trackedProducts: products.length,
        activeAlerts: dashboard.stats.activeAlerts,
        averageMargin: dashboard.stats.averageMargin
      },
      recommendations: dashboard.opportunities,
      riskRegister: atRisk.map((product) => ({
        sku: product.sku,
        name: product.name,
        status: product.status,
        spreadPercent: product.spreadPercent,
        lowestCompetitor: product.lowestCompetitor
      })),
      alertSummary: alerts
    };
  }

  async systemStatus() {
    const [database, redis] = await Promise.all([db.ping(), cache.ping()]);
    return {
      api: 'ok',
      database: database ? 'connected' : 'unavailable',
      cache: redis ? 'connected' : 'disabled',
      databaseDetails: db.status(),
      cacheDetails: cache.status(),
      uptime: process.uptime(),
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = new ProductService();
