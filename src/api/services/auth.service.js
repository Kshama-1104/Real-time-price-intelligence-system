const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authConfig = require('../../../config/auth.config');
const env = require('../../config/env');
const db = require('../../database/pool');

const DEFAULT_PREFERENCES = {
  weeklyDigest: true,
  criticalAlerts: true,
  reportFormat: 'pdf'
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  const [salt, hash] = String(storedPassword || '').split(':');
  if (!salt || !hash) {
    return false;
  }

  const attempted = hashPassword(password, salt).split(':')[1];
  if (attempted.length !== hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(attempted));
};

const demoUsers = [
  {
    id: 'usr-admin',
    name: 'Kshama Admin',
    email: 'admin@pricepulse.com',
    password: hashPassword('admin123'),
    role: 'admin',
    company: 'PricePulse Demo Co',
    organizationId: 'org-pricepulse-demo',
    preferences: DEFAULT_PREFERENCES,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-analyst',
    name: 'Pricing Analyst',
    email: 'analyst@pricepulse.com',
    password: hashPassword('analyst123'),
    role: 'analyst',
    company: 'PricePulse Demo Co',
    organizationId: 'org-pricepulse-demo',
    preferences: DEFAULT_PREFERENCES,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-client',
    name: 'Client Viewer',
    email: 'client@pricepulse.com',
    password: hashPassword('client123'),
    role: 'client',
    company: 'Retail Partner',
    organizationId: 'org-retail-partner',
    preferences: DEFAULT_PREFERENCES,
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

const memoryUsers = new Map(demoUsers.map((user) => [user.email, user]));

const parsePreferences = (value) => {
  if (!value) {
    return { ...DEFAULT_PREFERENCES };
  }

  if (typeof value === 'object') {
    return { ...DEFAULT_PREFERENCES, ...value };
  }

  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(value) };
  } catch (_error) {
    return { ...DEFAULT_PREFERENCES };
  }
};

const mapUserRow = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password_hash,
  role: row.role,
  company: row.company,
  organizationId: row.organization_id,
  preferences: parsePreferences(row.preferences),
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company,
  organizationId: user.organizationId,
  preferences: user.preferences || {},
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

class AuthService {
  async ensureDatabaseAvailable() {
    const online = await db.ping();
    if (online) {
      return true;
    }

    if (env.nodeEnv === 'production') {
      const error = new Error('Account service is not available. Please try again in a moment.');
      error.statusCode = 503;
      throw error;
    }

    return false;
  }

  async findUserByEmail(email) {
    const result = await db.query(`
      SELECT id, name, email, password_hash, role, company, organization_id, preferences, status, created_at, updated_at
      FROM app_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `, [email]);

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  async findUserById(id) {
    const result = await db.query(`
      SELECT id, name, email, password_hash, role, company, organization_id, preferences, status, created_at, updated_at
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `, [id]);

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  issueToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        company: user.company,
        organizationId: user.organizationId
      },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn,
        algorithm: authConfig.jwt.algorithm
      }
    );
  }

  getDemoUser(email) {
    if (!env.features.enableDemoAccounts) {
      return null;
    }
    return memoryUsers.get(email.toLowerCase()) || null;
  }

  async login(email, password) {
    const normalizedEmail = email.toLowerCase();
    const online = await this.ensureDatabaseAvailable();
    const user = online ? await this.findUserByEmail(normalizedEmail) : this.getDemoUser(normalizedEmail);
    const fallbackUser = user || this.getDemoUser(normalizedEmail);

    if (!fallbackUser || !verifyPassword(password, fallbackUser.password) || fallbackUser.status !== 'active') {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    return {
      user: publicUser(fallbackUser),
      token: this.issueToken(fallbackUser)
    };
  }

  async signup(payload) {
    const email = payload.email.toLowerCase();
    const online = await this.ensureDatabaseAvailable();
    const user = {
      id: `usr-${crypto.randomUUID()}`,
      name: payload.name,
      email,
      password: hashPassword(payload.password),
      role: 'client',
      company: payload.company || `${payload.name}'s Store`,
      organizationId: `org-${crypto.randomUUID()}`,
      preferences: { ...DEFAULT_PREFERENCES },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (!online) {
      if (memoryUsers.has(email)) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        throw error;
      }
      memoryUsers.set(email, user);
      return {
        user: publicUser(user),
        token: this.issueToken(user)
      };
    }

    try {
      const result = await db.query(`
        INSERT INTO app_users (id, name, email, password_hash, role, company, organization_id, preferences, status)
        VALUES ($1, $2, $3, $4, 'client', $5, $6, $7::jsonb, 'active')
        RETURNING id, name, email, password_hash, role, company, organization_id, preferences, status, created_at, updated_at
      `, [
        user.id,
        user.name,
        user.email,
        user.password,
        user.company,
        user.organizationId,
        JSON.stringify(user.preferences)
      ]);

      const savedUser = mapUserRow(result.rows[0]);
      return {
        user: publicUser(savedUser),
        token: this.issueToken(savedUser)
      };
    } catch (error) {
      if (error.code === '23505') {
        error.message = 'User already exists';
        error.statusCode = 409;
      }
      throw error;
    }
  }

  async me(tokenPayload) {
    const online = await this.ensureDatabaseAvailable();
    const user = online
      ? await this.findUserById(tokenPayload.id)
      : Array.from(memoryUsers.values()).find((item) => item.id === tokenPayload.id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return publicUser(user);
  }

  async listUsers() {
    const online = await this.ensureDatabaseAvailable();
    if (!online) {
      return Array.from(memoryUsers.values()).map(publicUser);
    }

    const result = await db.query(`
      SELECT id, name, email, password_hash, role, company, organization_id, preferences, status, created_at, updated_at
      FROM app_users
      ORDER BY created_at DESC
    `);

    return result.rows.map(mapUserRow).map(publicUser);
  }

  async updateProfile(tokenPayload, payload) {
    const online = await this.ensureDatabaseAvailable();
    const current = online
      ? await this.findUserById(tokenPayload.id)
      : Array.from(memoryUsers.values()).find((item) => item.id === tokenPayload.id);

    if (!current) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const nextPreferences = {
      ...(current.preferences || {}),
      ...(payload.preferences || {})
    };

    if (!online) {
      current.name = payload.name || current.name;
      current.company = payload.company || current.company;
      current.preferences = nextPreferences;
      current.updatedAt = new Date().toISOString();
      return publicUser(current);
    }

    const result = await db.query(`
      UPDATE app_users
      SET name = COALESCE($2, name),
          company = COALESCE($3, company),
          preferences = $4::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, password_hash, role, company, organization_id, preferences, status, created_at, updated_at
    `, [
      current.id,
      payload.name || null,
      payload.company || null,
      JSON.stringify(nextPreferences)
    ]);

    return publicUser(mapUserRow(result.rows[0]));
  }
}

module.exports = new AuthService();
