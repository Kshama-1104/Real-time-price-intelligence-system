const express = require('express');
const productController = require('../controllers/product.controller');
const {
  validate,
  productSchema,
  productUpdateSchema,
  observationSchema,
  alertStatusSchema,
  listQuerySchema
} = require('../validators/product.validator');
const { requireSession, allowRoles } = require('../middlewares/session.middleware');

const router = express.Router();

router.use(requireSession);

router.get('/summary', productController.dashboard);
router.get('/products', validate(listQuerySchema, 'query'), productController.list);
router.post('/products', allowRoles('admin', 'analyst', 'client'), validate(productSchema), productController.create);
router.get('/products/:id', productController.get);
router.put('/products/:id', allowRoles('admin', 'analyst', 'client'), validate(productUpdateSchema), productController.update);
router.delete('/products/:id', allowRoles('admin', 'analyst', 'client'), productController.delete);
router.post('/products/:id/prices', allowRoles('admin', 'analyst', 'client'), validate(observationSchema), productController.recordPrice);
router.get('/alerts', productController.alerts);
router.patch('/alerts/:id', allowRoles('admin', 'analyst', 'client'), validate(alertStatusSchema), productController.updateAlert);
router.get('/reports/executive', productController.report);
router.get('/system', productController.system);

module.exports = router;
