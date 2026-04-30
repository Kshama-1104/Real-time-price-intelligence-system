const { randomUUID } = require('crypto');
const db = require('../../database/pool');
const cache = require('../../cache/redis');
const logger = require('../../core/logger');
const seedData = require('../../data/seed-data');

const clone = (value) => JSON.parse(JSON.stringify(value));
const memoryProducts = clone(seedData.products);
const memoryAlerts = clone(seedData.alerts);

const toNumber = (value) => Number.parseFloat(value || 0);

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
  async loadProducts() {
    const online = await db.ping();
    if (!online) {
      return memoryProducts.map(enrichProduct);
    }

    try {
      const productResult = await db.query(`
        SELECT id, sku, name, category, brand, channel, our_price, cost, target_margin, stock, status, updated_at
        FROM products
        ORDER BY updated_at DESC
      `);

      if (productResult.rows.length === 0) {
        return memoryProducts.map(enrichProduct);
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
      logger.warn(`Falling back to in-memory products: ${error.message}`);
      return memoryProducts.map(enrichProduct);
    }
  }

  async loadAlerts() {
    const online = await db.ping();
    if (!online) {
      return clone(memoryAlerts);
    }

    try {
      const result = await db.query(`
        SELECT id, severity, product_id AS "productId", title, message, status, created_at AS "createdAt"
        FROM alert_rules
        ORDER BY created_at DESC
        LIMIT 25
      `);

      return result.rows.length > 0 ? result.rows : clone(memoryAlerts);
    } catch (error) {
      logger.warn(`Falling back to in-memory alerts: ${error.message}`);
      return clone(memoryAlerts);
    }
  }

  async getDashboard() {
    const cacheKey = 'price-intelligence:dashboard';
    const cached = await cache.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.loadProducts();
    const alerts = await this.loadAlerts();
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

  async list(filters) {
    const products = await this.loadProducts();
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

  async getById(id) {
    const products = await this.loadProducts();
    return products.find((product) => product.id === id || product.sku === id) || null;
  }

  async create(payload) {
    const product = {
      id: `prd-${randomUUID()}`,
      ...payload,
      competitors: [],
      priceHistory: [],
      updatedAt: new Date().toISOString()
    };

    const online = await db.ping();
    if (online) {
      await db.query(`
        INSERT INTO products (id, sku, name, category, brand, channel, our_price, cost, target_margin, stock, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        product.id,
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
    } else {
      memoryProducts.unshift(product);
    }

    await cache.deleteByPattern('price-intelligence:*');
    return enrichProduct(product);
  }

  async recordPriceObservation(productId, payload) {
    const online = await db.ping();
    if (online) {
      await db.query(`
        INSERT INTO price_observations (product_id, retailer, price, availability, rating, observed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        productId,
        payload.retailer,
        payload.price,
        payload.availability,
        payload.rating,
        payload.observedAt
      ]);
    } else {
      const product = memoryProducts.find((item) => item.id === productId || item.sku === productId);
      if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
      }
      const observedAt = payload.observedAt instanceof Date ? payload.observedAt.toISOString() : payload.observedAt;
      product.competitors = product.competitors.filter((item) => item.retailer !== payload.retailer);
      product.competitors.push({
        retailer: payload.retailer,
        price: payload.price,
        availability: payload.availability,
        rating: payload.rating,
        updatedAt: observedAt
      });
      product.priceHistory.push({
        time: observedAt,
        ourPrice: product.ourPrice,
        marketPrice: payload.price
      });
      product.updatedAt = new Date().toISOString();
    }

    await cache.deleteByPattern('price-intelligence:*');
    return this.getById(productId);
  }

  async listAlerts() {
    return this.loadAlerts();
  }

  async systemStatus() {
    const [database, redis] = await Promise.all([db.ping(), cache.ping()]);
    return {
      api: 'ok',
      database: database ? 'connected' : 'fallback',
      cache: redis ? 'connected' : 'disabled',
      databaseDetails: db.status(),
      cacheDetails: cache.status(),
      uptime: process.uptime(),
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = new ProductService();
