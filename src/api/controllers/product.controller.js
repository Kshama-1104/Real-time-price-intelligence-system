const productService = require('../services/product.service');
const responseUtil = require('../../utils/response.util');

class ProductController {
  async dashboard(req, res, next) {
    try {
      const dashboard = await productService.getDashboard();
      res.json(responseUtil.success(dashboard));
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const products = await productService.list(req.query);
      res.json(responseUtil.success(products));
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const product = await productService.getById(req.params.id);
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
      const product = await productService.create(req.body);
      res.status(201).json(responseUtil.success(product, 'Product created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async recordPrice(req, res, next) {
    try {
      const product = await productService.recordPriceObservation(req.params.id, req.body);
      const io = req.app.get('io');

      if (io) {
        io.emit('price:updated', product);
      }

      res.status(201).json(responseUtil.success(product, 'Price observation recorded'));
    } catch (error) {
      next(error);
    }
  }

  async alerts(req, res, next) {
    try {
      const alerts = await productService.listAlerts();
      res.json(responseUtil.success(alerts));
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
