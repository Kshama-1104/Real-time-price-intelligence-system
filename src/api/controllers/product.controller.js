const productService = require('../services/product.service');
const responseUtil = require('../../utils/response.util');

class ProductController {
  async dashboard(req, res, next) {
    try {
      const dashboard = await productService.getDashboard(req.user);
      res.json(responseUtil.success(dashboard));
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const products = await productService.list(req.user, req.query);
      res.json(responseUtil.success(products));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const product = await productService.getById(req.user, req.params.id);
      if (!product) {
        return res.status(404).json(responseUtil.error('Product not found', 404));
      }
      return res.json(responseUtil.success(product));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.user, req.body);
      res.status(201).json(responseUtil.success(product, 'Product created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.update(req.user, req.params.id, req.body);
      const io = req.app.get('io');
      if (io) {
        io.emit('product:updated', { id: product.id });
      }
      res.json(responseUtil.success(product, 'Product updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productService.delete(req.user, req.params.id);
      const io = req.app.get('io');
      if (io) {
        io.emit('product:deleted', { id: req.params.id });
      }
      res.json(responseUtil.success(null, 'Product deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async recordPrice(req, res, next) {
    try {
      const product = await productService.recordPriceObservation(req.user, req.params.id, req.body);
      const io = req.app.get('io');

      if (io) {
        io.emit('price:updated', { id: product.id });
      }

      res.status(201).json(responseUtil.success(product, 'Price observation recorded'));
    } catch (error) {
      next(error);
    }
  }

  async scanMarket(req, res, next) {
    try {
      const result = await productService.scanMarket(req.user, req.params.id);
      const io = req.app.get('io');

      if (io) {
        io.emit('price:updated', { id: result.product.id });
      }

      res.json(responseUtil.success(result, 'Market scan completed'));
    } catch (error) {
      next(error);
    }
  }

  async alerts(req, res, next) {
    try {
      const alerts = await productService.listAlerts(req.user);
      res.json(responseUtil.success(alerts));
    } catch (error) {
      next(error);
    }
  }

  async updateAlert(req, res, next) {
    try {
      const alerts = await productService.updateAlert(req.user, req.params.id, req.body);
      res.json(responseUtil.success(alerts, 'Alert updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async report(req, res, next) {
    try {
      const report = await productService.report(req.user);
      res.json(responseUtil.success(report));
    } catch (error) {
      next(error);
    }
  }

  async system(req, res, next) {
    try {
      const status = await productService.systemStatus();
      res.json(responseUtil.success(status));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
