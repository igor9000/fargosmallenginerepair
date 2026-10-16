
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');

module.exports = function({ db }) {
  const router = express.Router();

  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET) {
    throw new Error('Admin authentication is not configured');
  }

  const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: false
  });

  router.use(session({
    name: 'fms_admin',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    }
  }));

  function requireAdmin(req, res, next) {
    if (req.session?.isAdmin === true) {
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }

  function requireSameOrigin(req, res, next) {
    const origin = req.get('origin');

    if (!process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false
  });

  // Public authentication endpoints
  router.post('/login', loginLimiter, requireSameOrigin, async (req, res, next) => {
    try {
      const password = req.body?.password;

      if (typeof password !== 'string' || password.length > 1024) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const valid = await bcrypt.compare(
        password,
        process.env.ADMIN_PASSWORD_HASH
      );

      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.regenerate(err => {
        if (err) return next(err);

        req.session.isAdmin = true;

        req.session.save(err => {
          if (err) return next(err);
          res.json({ authenticated: true });
        });
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/session', requireAdmin, (req, res) => {
    res.json({ authenticated: true });
  });

  router.post('/logout', requireSameOrigin, requireAdmin, (req, res, next) => {
    req.session.destroy(err => {
      if (err) return next(err);

      res.clearCookie('fms_admin', { path: '/' });
      res.json({ authenticated: false });
    });
  });

  // Everything below requires authentication.
  router.use(requireAdmin);

  router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return requireSameOrigin(req, res, next);
    }
    next();
  });

  //router.use('/inventory', require('./inventory.cjs')({ db }));

  return router;
};
