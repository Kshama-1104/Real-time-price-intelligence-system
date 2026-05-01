const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(80).required(),
  company: Joi.string().trim().min(2).max(120).default('Self Serve')
});

const profileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80),
  company: Joi.string().trim().min(2).max(120),
  preferences: Joi.object({
    weeklyDigest: Joi.boolean(),
    criticalAlerts: Joi.boolean(),
    reportFormat: Joi.string().valid('pdf', 'csv', 'json')
  }).default({})
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    error.statusCode = 400;
    error.message = error.details.map((detail) => detail.message).join(', ');
    return next(error);
  }

  req.body = value;
  return next();
};

module.exports = {
  validate,
  loginSchema,
  signupSchema,
  profileSchema
};
