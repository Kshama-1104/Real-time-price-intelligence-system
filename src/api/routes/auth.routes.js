const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireSession, allowRoles } = require('../middlewares/session.middleware');
const { validate, loginSchema, signupSchema, profileSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/logout', authController.logout);
router.get('/me', requireSession, authController.me);
router.patch('/profile', requireSession, validate(profileSchema), authController.updateProfile);
router.get('/users', requireSession, allowRoles('admin'), authController.users);

module.exports = router;
