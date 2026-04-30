# API Documentation

Base URL:

```text
/api/v1/price-intelligence
```

All responses use the shared envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-04-30T00:00:00.000Z"
}
```

## Dashboard Summary

```http
GET /summary
```

Returns KPI cards, trend data, category spread data, pricing recommendations, and active alerts.

## Products

```http
GET /products?search=buds&category=Audio&status=watch&page=1&limit=50
```

Query parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `search` | string | Matches product name, SKU, or brand |
| `category` | string | Exact category filter |
| `status` | string | `healthy`, `watch`, `action`, or `opportunity` |
| `page` | number | Defaults to `1` |
| `limit` | number | Defaults to `50`, max `100` |

```http
GET /products/:id
```

`:id` may be a product id or SKU.

```http
POST /products
Content-Type: application/json
```

```json
{
  "sku": "CAM-9001",
  "name": "ViewMax 4K Action Camera",
  "category": "Cameras",
  "brand": "ViewMax",
  "channel": "Marketplace",
  "ourPrice": 149.99,
  "cost": 82.25,
  "targetMargin": 35,
  "stock": 220,
  "status": "watch"
}
```

## Price Observations

```http
POST /products/:id/prices
Content-Type: application/json
```

```json
{
  "retailer": "Amazon",
  "price": 143.49,
  "availability": "In stock",
  "rating": 4.4
}
```

Successful writes emit a Socket.IO `price:updated` event.

## Alerts

```http
GET /alerts
```

Returns the current pricing alert queue.

## System Status

```http
GET /system
```

Returns API, PostgreSQL, Redis, uptime, and fallback status.

## Operations

```http
GET /health
GET /metrics
```

`/metrics` exposes Prometheus-compatible process metrics.
