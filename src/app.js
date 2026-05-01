const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./core/logger');
const env = require('./config/env');

// Import routes
const topicRoutes = require('./api/routes/topic.routes');
const eventRoutes = require('./api/routes/event.routes');
const consumerRoutes = require('./api/routes/consumer.routes');
const metricsRoutes = require('./api/routes/metrics.routes');
const productRoutes = require('./api/routes/product.routes');
const authRoutes = require('./api/routes/auth.routes');

// Import middlewares
const errorMiddleware = require('./api/middlewares/error.middleware');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigins,
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Join topic room for real-time updates
  socket.on('join:topic', (topicName) => {
    socket.join(`topic:${topicName}`);
    logger.info(`Socket ${socket.id} joined topic ${topicName}`);
  });
});

// Make io available to routes
app.set('io', io);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const publicPath = path.join(__dirname, '..', 'public');

// Serve the built React dashboard when available, with the legacy static UI as a fallback.
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'real-time-price-intelligence-system',
    version: '2.0.0'
  });
});

app.get('/metrics', (req, res) => {
  const memory = process.memoryUsage();
  const lines = [
    '# HELP price_intelligence_process_uptime_seconds Process uptime in seconds',
    '# TYPE price_intelligence_process_uptime_seconds gauge',
    `price_intelligence_process_uptime_seconds ${process.uptime().toFixed(0)}`,
    '# HELP price_intelligence_memory_heap_used_bytes Node.js heap used in bytes',
    '# TYPE price_intelligence_memory_heap_used_bytes gauge',
    `price_intelligence_memory_heap_used_bytes ${memory.heapUsed}`,
    '# HELP price_intelligence_memory_rss_bytes Resident set size in bytes',
    '# TYPE price_intelligence_memory_rss_bytes gauge',
    `price_intelligence_memory_rss_bytes ${memory.rss}`
  ];

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(`${lines.join('\n')}\n`);
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/price-intelligence', productRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/topics/:topicName/events', eventRoutes);
app.use('/api/v1/consumer-groups', consumerRoutes);
app.use('/api/v1/metrics', metricsRoutes);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const clientIndex = path.join(clientDistPath, 'index.html');
  const publicIndex = path.join(publicPath, 'index.html');
  const indexPath = fs.existsSync(clientIndex) ? clientIndex : publicIndex;
  return res.sendFile(indexPath);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Export both app and httpServer for Socket.io
module.exports = { app, httpServer };
