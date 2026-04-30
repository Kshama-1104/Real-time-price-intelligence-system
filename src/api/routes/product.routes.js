const express = require('express');
const productController = require('../controllers/product.controller');
const {
  validate,
  productSchema,
  observationSchema,
  listQuerySchema
} = require('../validators/product.validator');

const router = express.Router();

router.get('/summary', productController.dashboard);
router.get('/products', validate(listQuerySchema, 'query'), productController.list);
router.post('/products', validate(productSchema), productController.create);
router.get('/products/:id', productController.get);
router.post('/products/:id/prices', validate(observationSchema), productController.recordPrice);
router.get('/alerts', productController.alerts);
router.get('/system', productController.system);

module.exports = router;
