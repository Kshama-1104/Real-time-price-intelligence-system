# Architecture

## Runtime View

```text
React Dashboard
  |
  | REST + Socket.IO
  v
Nginx reverse proxy
  |
  v
Node.js Express API
  |        |
  |        +-- Redis cache for dashboard and product reads
  |
  +-- PostgreSQL for product, competitor price, and alert data

Prometheus scrapes /metrics
Grafana visualizes Prometheus data
Winston writes structured application logs
```

## Backend Modules

| Module | Responsibility |
| --- | --- |
| `src/app.js` | Express app, middleware, routes, static React serving, health and metrics |
| `src/api/routes/product.routes.js` | Price intelligence REST routes |
| `src/api/services/product.service.js` | Pricing calculations, product reads/writes, cache strategy, DB fallback |
| `src/database/pool.js` | PostgreSQL connection pool and status checks |
| `src/cache/redis.js` | Redis client, JSON cache helpers, graceful degradation |
| `src/core/logger` | Winston structured logging |

## Frontend Modules

| Module | Responsibility |
| --- | --- |
| `client/src/App.jsx` | Dashboard composition, filters, charts, product table, alert queue |
| `client/src/services/api.js` | REST client and Socket.IO base URL |
| `client/src/data/fallback.js` | Demo UI data when the API is not reachable |
| `client/src/index.css` | Tailwind entry and global UI behavior |

## Data Flow

1. The dashboard requests `/api/v1/price-intelligence/summary`.
2. The API attempts to serve the summary from Redis.
3. On cache miss, PostgreSQL product, price observation, and alert records are loaded.
4. Product margin, lowest competitor, spread, recommended price, and category performance are computed.
5. The response is cached briefly and returned to the UI.
6. New price observations invalidate the cache and emit `price:updated` through Socket.IO.

## Failure Behavior

- If PostgreSQL is unavailable, the API serves seeded in-memory demo data.
- If Redis is unavailable, requests continue without caching.
- `/api/v1/price-intelligence/system` exposes whether the app is connected or in fallback mode.
- `/metrics` stays available for process monitoring even when data infrastructure is down.
