const authService = require('../services/auth.service');
const responseUtil = require('../../utils/response.util');

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 24 * 60 * 60 * 1000
};

const setSessionCookie = (res, session) => {
  res.cookie('pricepulse_session', session.token, sessionCookieOptions);
};

class AuthController {
  async login(req, res, next) {
    try {
      const session = await authService.login(req.body.email, req.body.password);
      setSessionCookie(res, session);
      res.json(responseUtil.success(session, 'Logged in successfully'));
    } catch (error) {
      next(error);
    }
  }

  async signup(req, res, next) {
    try {
      const session = await authService.signup(req.body);
      setSessionCookie(res, session);
      res.status(201).json(responseUtil.success(session, 'Account created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      res.json(responseUtil.success(await authService.me(req.user)));
    } catch (error) {
      next(error);
    }
  }

  async users(req, res, next) {
    try {
      res.json(responseUtil.success(await authService.listUsers()));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user, req.body);
      res.json(responseUtil.success(user, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  logout(_req, res) {
    res.clearCookie('pricepulse_session', sessionCookieOptions);
    res.json(responseUtil.success(null, 'Logged out successfully'));
  }
}

module.exports = new AuthController();
