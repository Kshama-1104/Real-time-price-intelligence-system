# Real-Time Price Intelligence System

Full-stack web application for tracking products, comparing competitor prices, generating pricing recommendations, and exporting executive reports.

## Live Website

Deployment URL: Add your hosted website link here after deployment.

Example:

```text
https://your-price-intelligence-app.onrender.com
```

## What This Project Includes

- Frontend: React, Vite, Tailwind CSS, Recharts, Socket.io client
- Backend: Node.js, Express, REST APIs, JWT authentication, Socket.io
- Database: PostgreSQL migrations for users, products, observations, alerts, and workspace isolation
- Cache and realtime support: Redis
- Deployment: Dockerfile, Docker Compose, Nginx config, Prometheus config, GitHub Actions workflow

## Main Features

- User signup and login
- Role-based access for admin, analyst, and client users
- Product tracking by SKU, category, brand, price, margin, stock, and status
- Competitor price observations
- Automatic market scan simulation
- Pricing recommendations such as Protect rank, Lift margin, and Hold band
- Alert queue for competitor undercuts and margin opportunities
- Executive report view with CSV/JSON export support
- System health view for API, PostgreSQL, and Redis status

## Project Structure

```text
Real-time-price-intelligence-system/
|-- client/                 React frontend
|-- src/                    Express backend
|   |-- api/                Routes, controllers, services, validators, middleware
|   |-- cache/              Redis client
|   |-- config/             Runtime environment config
|   |-- database/           PostgreSQL pool and migrations
|   |-- data/               Demo seed data
|-- deploy/                 Nginx and Prometheus config
|-- docs/                   Architecture and deployment docs
|-- Dockerfile              Production API + built frontend image
|-- docker-compose.yml      Local/VM full-stack deployment
|-- .env.example            Environment variable template
```

## Run Locally

Prerequisites:

- Node.js 18 or newer
- PostgreSQL 14 or newer
- Redis 6 or newer
- Docker Desktop, optional but recommended

### Option 1: Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

Open:

```text
http://localhost
```

### Option 2: Manual Development

Start PostgreSQL and Redis, then:

```bash
cp .env.example .env
npm install
npm --prefix client install
npm run db:migrate
npm run dev
```

In another terminal:

```bash
npm run client:dev
```

Open:

```text
http://localhost:5173
```

## Important Environment Variables

```text
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-live-site-url
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379
JWT_SECRET=replace-with-a-long-random-secret
COOKIE_SECURE=true
ENABLE_DEMO_ACCOUNTS=false
ALLOW_DEMO_DATA=false
```

For local demo mode, you can set:

```text
ENABLE_DEMO_ACCOUNTS=true
ALLOW_DEMO_DATA=true
```

Demo accounts:

```text
admin@pricepulse.com / admin123
analyst@pricepulse.com / analyst123
client@pricepulse.com / client123
```

## Database Setup

Run migrations:

```bash
npm run db:migrate
```

The migrations create:

- `app_users`
- `products`
- `price_observations`
- `alert_rules`
- workspace isolation columns and indexes

## Deployment

The simplest production path is Docker:

1. Push this repository to GitHub.
2. Create managed PostgreSQL and Redis services.
3. Build and deploy the Docker image from this repository.
4. Set the production environment variables.
5. Run database migrations once.
6. Add the deployed URL to the Live Website section above.

Recommended platforms:

- Render: Web Service with Docker, plus managed PostgreSQL and Redis
- Railway: Docker app, PostgreSQL plugin, Redis plugin
- AWS: EC2 or ECS, RDS PostgreSQL, ElastiCache Redis, Nginx reverse proxy

GitHub Actions already validates backend tests, frontend build, and Docker build. It can also deploy to EC2 when these repository secrets are configured:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
EC2_APP_PATH
```

## Verification Commands

```bash
npm test
npm run client:build
docker build -t price-intelligence .
```

## Creator

Created by Kshama Mishra.
