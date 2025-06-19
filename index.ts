import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { testDatabaseConnection } from "./db";
// Simple logging function
const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${message}`);
};
import { initializeCache, cacheMetrics, cacheWarming } from "./cache";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Add global error handlers to prevent crashes in production
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    // In production, log the error but don't exit
    console.error('Production server continuing after uncaught exception');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    // In production, log the error but don't exit
    console.error('Production server continuing after unhandled rejection');
  } else {
    process.exit(1);
  }
});

// Serve the specific logo file for email templates
app.get('/api/logo', (req, res) => {
  res.sendFile('image_1749147282780.png', {
    root: './attached_assets',
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400'
    }
  }, (err) => {
    if (err) {
      res.status(404).json({ error: 'Logo not found' });
    }
  });
});

// Image proxy endpoint to handle external images
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL format
    const imageUrl = new URL(url);
    
    // Only allow specific trusted domains
    const allowedDomains = [
      'images.unsplash.com',
      'plus.unsplash.com',
      'unsplash.com',
      'cdn.krugmaninsights.com'
    ];
    
    if (!allowedDomains.includes(imageUrl.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KrugmanInsights/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });

    // Stream the image
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
    
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Provide a fallback image URL instead of returning error
    const fallbackImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=320&fit=crop&auto=format&q=80';
    
    try {
      const fallbackResponse = await fetch(fallbackImageUrl);
      if (fallbackResponse.ok) {
        const contentType = fallbackResponse.headers.get('content-type');
        res.set({
          'Content-Type': contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        });
        
        const arrayBuffer = await fallbackResponse.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
        return;
      }
    } catch (fallbackError) {
      console.error('Fallback image also failed:', fallbackError);
    }
    
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// World-class performance middleware with OAuth optimization
app.use(compression({
  level: 6, // Balanced compression
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    // Prioritize OAuth callback responses for faster loading
    if (req.path.includes('/auth/') && req.path.includes('/callback')) {
      return true;
    }
    // Use compression for all compressible content
    return compression.filter(req, res);
  }
}));

// Express optimizations
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Session middleware with database store for persistent authentication
const pgStore = connectPg(session);
app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    // Use proper connection configuration to prevent overflow
    pruneSessionInterval: 60, // Clean up expired sessions every 60 seconds
    errorLog: console.error
  }),
  secret: process.env.SESSION_SECRET || 'krugman-insights-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Performance and security headers
app.use((req, res, next) => {
  // Cache control for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Minimal headers only
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize sophisticated cache system
  initializeCache();
  
  // Add cache health monitoring endpoint
  app.get('/api/cache/health', (req, res) => {
    res.json(cacheMetrics.healthCheck());
  });
  
  // Add cache metrics endpoint
  app.get('/api/cache/metrics', (req, res) => {
    res.json(cacheMetrics.getMetrics());
  });

  // Add server health check endpoint for deployment monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  const server = await registerRoutes(app);
  
  // Add startup readiness check
  let serverReady = false;
  
  // Add readiness probe endpoint for deployment
  app.get('/ready', (req, res) => {
    if (serverReady) {
      res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ ready: false, message: 'Server starting up...' });
    }
  });

  // Debug endpoint to check production file structure
  app.get('/debug/files', (req, res) => {
    if (process.env.NODE_ENV === "production") {
      const deploymentDistPath = path.resolve(process.cwd(), "dist");
      const buildDistPath = path.resolve(process.cwd(), "dist", "public");
      const deploymentIndexPath = path.resolve(deploymentDistPath, "index.html");
      const buildIndexPath = path.resolve(buildDistPath, "index.html");
      
      res.json({
        environment: process.env.NODE_ENV,
        cwd: process.cwd(),
        paths: {
          deployment: {
            path: deploymentDistPath,
            indexExists: fs.existsSync(deploymentIndexPath),
            files: fs.existsSync(deploymentDistPath) ? fs.readdirSync(deploymentDistPath) : 'dist does not exist'
          },
          build: {
            path: buildDistPath,
            indexExists: fs.existsSync(buildIndexPath),
            files: fs.existsSync(buildDistPath) ? fs.readdirSync(buildDistPath) : 'dist/public does not exist'
          }
        },
        activeConfiguration: fs.existsSync(deploymentIndexPath) ? 'deployment' : 'build'
      });
    } else {
      res.json({ environment: 'development' });
    }
  });
  
  // Initialize firm lifecycle management system on startup
  // Temporarily disabled to prevent database timeout issues
  // setTimeout(async () => {
  //   try {
  //     console.log('🏢 Initializing firm lifecycle management system...');
  //     const { FirmLifecycleManager } = await import('./services/firmLifecycleManager');
  //     await FirmLifecycleManager.initialize();
  //     console.log('✅ Firm lifecycle management system initialized - automatic firm integration ready!');
  //   } catch (error) {
  //     console.error('Firm lifecycle initialization failed:', error);
  //   }
  // }, 1000);

  // Warm cache for recent articles on startup to ensure rapid access
  // setTimeout(async () => {
  //   try {
  //     console.log('🔥 Warming cache for recent articles on startup...');
  //     await cacheWarming.warmRecentArticles(15);
  //     console.log('✅ Startup cache warming completed - articles ready for instant access!');
  //   } catch (error) {
  //     console.error('Failed to warm recent articles cache:', error.message);
  //   }
  // }, 2000);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details for debugging
    log(`Error ${status}: ${message} on ${req.method} ${req.path}`);
    
    // Send error response
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // In production, don't throw the error to prevent server crashes
    if (process.env.NODE_ENV === "production") {
      console.error("Production error:", err);
    } else {
      throw err;
    }
  });

  // Backend-only setup - no frontend serving needed
  // This is a pure API server for AWS EC2 deployment

  // Configure port for different environments
  // Development: 5000, Production: 8080 (or PORT env var)
  const port = parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '8080' : '5000'), 10);
  
  // Configure host binding
  // Development: 0.0.0.0 (allows external access in Replit)
  // Production: 0.0.0.0 (allows access from load balancer/reverse proxy)
  const host = "0.0.0.0";
  
  server.listen(port, host, async () => {
    log(`Server running at http://${host}:${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV === 'production') {
      log(`Production server ready for EC2 deployment`);
      log(`Accessible via load balancer or public IP on port ${port}`);
    } else {
      log(`Development server - Preview should be available externally`);
    }
    
    log(`Cache system: ACTIVE with multi-layer architecture`);
    log(`Health monitoring: Available at /api/cache/health`);
    
    // Test database connection
    await testDatabaseConnection();
    
    // Mark server as ready after startup
    setTimeout(() => {
      serverReady = true;
      log(`Server fully ready for connections`);
    }, 1000);
  });
})();
