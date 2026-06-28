import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import routes
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import revenueRoutes from './routes/revenue.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────

// CORS — explicitly allow the deployed frontend origin
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON and cookies
app.use(express.json());

// Simple cookie parser (httpOnly JWT cookies)
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      req.cookies[name.trim()] = rest.join('=').trim();
    });
  }
  next();
});

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Routes ─────────────────────────────────────────────────

// Auth routes (Google OAuth + Admin login)
app.use('/auth', authRoutes);

// Owner API routes (authenticated)
app.use('/api/properties', propertyRoutes);
app.use('/api', roomRoutes);
app.use('/api', bookingRoutes);
app.use('/api', revenueRoutes);

// Public routes (no auth, rate-limited)
app.use('/api/public', publicLimiter, publicRoutes);

// Super Admin routes (admin auth)
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database Connection & Server Start ─────────────────────

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 AvailNow API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
