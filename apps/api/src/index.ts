/**
 * Quantum Game API Server
 * 
 * Hono-based REST API for the Quantum board game
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { connectDatabase } from './models/index.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';

// =============================================================================
// APP SETUP
// =============================================================================

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    name: 'Quantum Game API',
    version: '0.1.0',
    status: 'ok',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

// Routes
app.route('/auth', authRoutes);
app.route('/games', gameRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = parseInt(process.env.PORT || '3000');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum';

async function main() {
  try {
    // Connect to MongoDB
    await connectDatabase(MONGODB_URI);
    
    // Start server
    console.log(`🚀 Quantum API starting on port ${PORT}`);
    
    serve({
      fetch: app.fetch,
      port: PORT,
    });
    
    console.log(`✅ Server running at http://localhost:${PORT}`);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default app;
