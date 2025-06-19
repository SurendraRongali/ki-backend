import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Production-compatible directory resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes and middleware
import { registerRoutes } from './routes.js';
import { createSecurityMiddleware } from '../security-config.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for production
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://replit.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security middleware
app.use(createSecurityMiddleware());

// Serve static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath, {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Initialize server with routes
async function startServer() {
  try {
    // Register API routes
    const httpServer = await registerRoutes(app);
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });

    // Start server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Production server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Serving static files from: ${publicPath}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();