const Joi = require('joi');

const productSchema = Joi.object({
  sku: Joi.string().trim().min(3).max(40).required(),
  name: Joi.string().trim().min(3).max(160).required(),
  category: Joi.string().trim().min(2).max(80).required(),
  brand: Joi.string().trim().min(2).max(80).required(),
  channel: Joi.string().trim().valid('Marketplace', 'D2C', 'Retail').default('Marketplace'),
  ourPrice: Joi.number().positive().precision(2).required(),
  cost: Joi.number().positive().precision(2).required(),
  targetMargin: Joi.number().min(0).max(95).default(35),
  stock: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('healthy', 'watch', 'action', 'opportunity').default('watch')
});

const productUpdateSchema = Joi.object({
  sku: Joi.string().trim().min(3).max(40),
  name: Joi.string().trim().min(3).max(160),
  category: Joi.string().trim().min(2).max(80),
  brand: Joi.string().trim().min(2).max(80),
  channel: Joi.string().trim().valid('Marketplace', 'D2C', 'Retail'),
  ourPrice: Joi.number().positive().precision(2),
  cost: Joi.number().positive().precision(2),
  targetMargin: Joi.number().min(0).max(95),
  stock: Joi.number().integer().min(0),
  status: Joi.string().valid('healthy', 'watch', 'action', 'opportunity')
}).min(1);

const alertStatusSchema = Joi.object({
  status: Joi.string().valid('open', 'investigating', 'closed').required()
});

const observationSchema = Joi.object({
  retailer: Joi.string().trim().min(2).max(80).required(),
  price: Joi.number().positive().precision(2).required(),
  availability: Joi.string().trim().max(80).default('In stock'),
  rating: Joi.number().min(0).max(5).precision(1).default(4),
  observedAt: Joi.date().iso().default(() => new Date())
});

const listQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').default(''),
  category: Joi.string().trim().allow('').default(''),
  status: Joi.string().valid('healthy', 'watch', 'action', 'opportunity', '').default(''),
  limit: Joi.number().integer().min(1).max(100).default(50),
  page: Joi.number().integer().min(1).default(1)
});

const validate = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    error.statusCode = 400;
    error.message = error.details.map((detail) => detail.message).join(', ');
    return next(error);
  }

  req[source] = value;
  return next();
};

module.exports = {
  validate,
  productSchema,
  productUpdateSchema,
  observationSchema,
  alertStatusSchema,
  listQuerySchema
};
