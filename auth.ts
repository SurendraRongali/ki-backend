import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "./shared/schema";
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface User extends SelectUser {
      needsSubscription?: boolean;
      oauthData?: any;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const bcrypt = await import('bcrypt');
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || typeof stored !== 'string') {
    return false;
  }
  
  try {
    // Check if password is bcrypt format (starts with $2b$, $2a$, or $2y$)
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')) {
      const bcrypt = await import('bcrypt');
      return await bcrypt.compare(supplied, stored);
    }
    
    // Check if password is scrypt format (contains a dot separator)
    if (stored.includes('.')) {
      const [hashed, salt] = stored.split(".");
      
      // Validate hash and salt format
      if (!hashed || !salt || hashed.length % 2 !== 0) {
        console.error('Invalid stored password format - hash or salt malformed');
        return false;
      }
      
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, hashedBuf.length)) as Buffer;
      
      // Ensure buffers are the same length before comparison
      if (hashedBuf.length !== suppliedBuf.length) {
        console.error(`Buffer length mismatch: stored=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
        return false;
      }
      
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
    
    // Unsupported format
    console.error('Unsupported password format:', stored.substring(0, 10) + '...');
    return false;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express, rateLimiters?: any) {
  // Apply rate limiting to authentication endpoints if provided
  if (rateLimiters) {
    app.use('/api/login', rateLimiters.auth);
    app.use('/api/register', rateLimiters.auth);
    app.use('/api/password-reset', rateLimiters.auth);
    app.use('/api/magic-link', rateLimiters.auth);
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "krugman-insights-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google Strategy with enhanced production support
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Enhanced URL resolution for production environments
    let baseURL;
    if (process.env.NODE_ENV === 'production') {
      baseURL = process.env.PRODUCTION_URL || 
                (process.env.REPLIT_DOMAINS?.split(',')[0] ? 
                 `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
                 'https://krugmaninsights.com');
    } else {
      baseURL = process.env.REPLIT_DEV_DOMAIN ? 
                `https://${process.env.REPLIT_DEV_DOMAIN}` :
                `https://${process.env.REPL_SLUG || 'localhost'}.replit.dev`;
    }
    
    console.log(`[AUTH] Google OAuth configured with callback URL: ${baseURL}/auth/google/callback`);
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${baseURL}/auth/google/callback`,
          scope: ['profile', 'email'],
          passReqToCallback: false
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              console.error('[AUTH] Google OAuth error: No email found in profile');
              return done(null, false, { message: "No email found in Google profile" });
            }

            const oauthUserData = {
              email,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value || null,
              provider: 'google'
            };

            console.log(`[AUTH] Google OAuth success for: ${email}`);
            return done(null, { needsSubscription: true, oauthData: oauthUserData });
          } catch (error) {
            console.error('[AUTH] Google OAuth strategy error:', error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn('[AUTH] Google OAuth not configured - missing credentials');
  }

  // LinkedIn Strategy
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    // Enhanced URL resolution for production environments
    let baseURL;
    if (process.env.NODE_ENV === 'production') {
      baseURL = process.env.PRODUCTION_URL || 
                (process.env.REPLIT_DOMAINS?.split(',')[0] ? 
                 `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
                 'https://krugmaninsights.com');
    } else {
      baseURL = process.env.REPLIT_DEV_DOMAIN ? 
                `https://${process.env.REPLIT_DEV_DOMAIN}` :
                `https://${process.env.REPL_SLUG || 'localhost'}.replit.dev`;
    }
    
    console.log(`[AUTH] LinkedIn OAuth configured with callback URL: ${baseURL}/auth/linkedin/callback`);
    
    passport.use(
      new LinkedInStrategy(
        {
          clientID: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          callbackURL: `${baseURL}/auth/linkedin/callback`,
          scope: ["openid", "profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log('LinkedIn profile data:', JSON.stringify(profile, null, 2));
            
            const email = profile.emails?.[0]?.value || profile.email;
            if (!email) {
              return done(null, false, { message: "No email found in LinkedIn profile" });
            }

            // Extract name data from LinkedIn profile structure
            const firstName = profile.name?.givenName || profile.given_name || profile.displayName?.split(' ')[0] || "";
            const lastName = profile.name?.familyName || profile.family_name || profile.displayName?.split(' ').slice(1).join(' ') || "";
            const profileImageUrl = profile.photos?.[0]?.value || profile.picture || null;

            // Store OAuth user data in session without logging in
            // Users must complete subscription before gaining access
            const oauthUserData = {
              email,
              firstName,
              lastName,
              profileImageUrl,
              provider: 'linkedin'
            };

            console.log(`[AUTH] LinkedIn OAuth success for: ${email}`);
            return done(null, { needsSubscription: true, oauthData: oauthUserData });
          } catch (error) {
            console.error('[AUTH] LinkedIn OAuth strategy error:', error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn('[AUTH] LinkedIn OAuth not configured - missing credentials');
  }

  passport.serializeUser((user, done) => {
    // CRITICAL: Do NOT serialize OAuth users who need subscription
    if (user.needsSubscription) {
      console.log('Blocking OAuth user serialization - subscription required');
      return done(new Error('OAuth users must complete subscription first'), false);
    }
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password: await hashPassword(password),
        subscriptionTier: req.body.subscriptionTier || "free",
        subscriptionStatus: "active",
        country: req.body.country || null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: {
          news: [],
          goals: [],
          sectors: [],
          companies: [],
          industries: []
        },
        isAdmin: false
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  // NOTE: User endpoint handled in routes.ts with enhanced OAuth blocking

  // Optimized Google OAuth routes (only if credentials are available)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/auth/google",
      (req, res, next) => {
        // Minimal logging for performance
        console.log('Starting Google OAuth flow');
        
        // Optimized headers for faster loading
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Cache-Control', 'no-cache');
        next();
      },
      passport.authenticate("google", { 
        scope: ["profile", "email"], // Minimal scope for speed
        prompt: 'select_account'
      })
    );
  } else {
    app.get("/auth/google", (req, res) => {
      res.send(`
        <html>
          <head><title>OAuth Unavailable</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-error',
                  provider: 'google',
                  error: 'Google OAuth is not configured in this environment'
                }, '*');
                window.close();
              } else {
                window.location.href = '/auth?error=oauth_not_configured';
              }
            </script>
            <p>OAuth authentication is not available in this environment.</p>
          </body>
        </html>
      `);
    });
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/auth/google/callback",
      (req, res, next) => {
        // Optimized headers for faster response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        next();
      },
      passport.authenticate("google", { 
        failureRedirect: "/auth?error=google_auth_failed",
        failureMessage: true 
      }),
    (req, res) => {
      console.log('Google OAuth callback:', {
        user: req.user ? 'OAuth data received' : 'No OAuth data',
        needsSubscription: req.user?.needsSubscription
      });
      
      if (req.user?.needsSubscription) {
        // Store OAuth data temporarily for subscription flow
        const oauthData = req.user.oauthData;
        
        console.log('Storing OAuth data in session:', { email: oauthData.email, provider: oauthData.provider });
        
        // Store OAuth data in session BEFORE any logout operations
        if (req.session) {
          (req.session as any).oauthData = oauthData;
          // Force session save to ensure data persists
          req.session.save((err) => {
            if (err) console.error('Session save error:', err);
          });
        }
        
        // Clear authentication and respond immediately without logout
        req.user = undefined;
        
        // Ultra-fast popup response with immediate closure
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Authenticating...</title></head><body><script>
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth-needs-subscription',
                provider: 'google',
                oauthData: ${JSON.stringify(oauthData)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/subscribe?oauth=google';
            }
          } catch(e) { window.location.href = '/subscribe?oauth=google'; }
        </script></body></html>`);
      } else {
        // Regular login for users with existing subscriptions
        res.send(`
          <html>
            <head><title>Login Successful</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'oauth-success',
                    provider: 'google'
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Login successful. Redirecting...</p>
            </body>
          </html>
        `);
      }
    }
    );
  } else {
    app.get("/auth/google/callback", (req, res) => {
      res.send(`
        <html>
          <head><title>OAuth Unavailable</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-error',
                  provider: 'google',
                  error: 'Google OAuth is not configured in this environment'
                }, '*');
                window.close();
              } else {
                window.location.href = '/auth?error=oauth_not_configured';
              }
            </script>
            <p>OAuth authentication is not available in this environment.</p>
          </body>
        </html>
      `);
    });
  }

  // LinkedIn OAuth routes (only if credentials are available)
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    app.get(
      "/auth/linkedin",
      passport.authenticate("linkedin", { state: "random-state-string" })
    );
  } else {
    app.get("/auth/linkedin", (req, res) => {
      res.send(`
        <html>
          <head><title>OAuth Unavailable</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-error',
                  provider: 'linkedin',
                  error: 'LinkedIn OAuth is not configured in this environment'
                }, '*');
                window.close();
              } else {
                window.location.href = '/auth?error=oauth_not_configured';
              }
            </script>
            <p>OAuth authentication is not available in this environment.</p>
          </body>
        </html>
      `);
    });
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    app.get(
      "/auth/linkedin/callback",
      (req, res, next) => {
        // Optimized headers for faster response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        next();
      },
    (req, res, next) => {
      passport.authenticate("linkedin", (err, user, info) => {
        if (err) {
          console.error('LinkedIn OAuth error:', err);
          if (err.message && err.message.includes('redirect_uri')) {
            console.error('LinkedIn redirect URI mismatch. Current domain:', process.env.REPLIT_DEV_DOMAIN);
            console.error('Expected callback URL:', `https://${process.env.REPLIT_DEV_DOMAIN}/auth/linkedin/callback`);
            return res.send(`
              <html>
                <head><title>LinkedIn Configuration Required</title></head>
                <body>
                  <script>
                    if (window.opener) {
                      window.opener.postMessage({
                        type: 'oauth-error',
                        provider: 'linkedin',
                        error: 'LinkedIn app needs to be configured with the correct redirect URI. Please contact admin to update LinkedIn app settings.'
                      }, '*');
                      window.close();
                    } else {
                      window.location.href = '/auth?error=linkedin_config_needed';
                    }
                  </script>
                  <p>LinkedIn configuration needed. Please contact admin.</p>
                </body>
              </html>
            `);
          }
          return next(err);
        }
        if (!user) {
          // Silently close popup without showing error message
          return res.send(`
            <html>
              <head><title>Authentication</title></head>
              <body>
                <script>
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = '/auth';
                  }
                </script>
              </body>
            </html>
          `);
        }
        req.user = user;
        next();
      })(req, res, next);
    },
    (req, res) => {
      console.log('LinkedIn OAuth callback:', {
        user: req.user ? 'OAuth data received' : 'No OAuth data',
        needsSubscription: req.user?.needsSubscription
      });
      
      if (req.user?.needsSubscription) {
        // Store OAuth data temporarily for subscription flow
        const oauthData = req.user.oauthData;
        
        // Simple approach: clear authentication immediately, store OAuth data
        req.user = undefined;
        
        // Store OAuth data in session safely
        if (req.session) {
          (req.session as any).oauthData = oauthData;
          delete (req.session as any).passport; // Clear passport data
        }
        
        // Logout from passport to ensure no authentication remains
        req.logout(() => {
          // Ultra-fast popup response with immediate closure
          res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Authenticating...</title></head><body><script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-needs-subscription',
                  provider: 'linkedin',
                  oauthData: ${JSON.stringify(oauthData)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/subscribe?oauth=linkedin';
              }
            } catch(e) { window.location.href = '/subscribe?oauth=linkedin'; }
          </script></body></html>`);
        });
      } else {
        // Regular login for users with existing subscriptions
        res.send(`
          <html>
            <head><title>Login Successful</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'oauth-success',
                    provider: 'linkedin'
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Login successful. Redirecting...</p>
            </body>
          </html>
        `);
      }
    }
    );
  } else {
    app.get("/auth/linkedin/callback", (req, res) => {
      res.send(`
        <html>
          <head><title>OAuth Unavailable</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-error',
                  provider: 'linkedin',
                  error: 'LinkedIn OAuth is not configured in this environment'
                }, '*');
                window.close();
              } else {
                window.location.href = '/auth?error=oauth_not_configured';
              }
            </script>
            <p>OAuth authentication is not available in this environment.</p>
          </body>
        </html>
      `);
    });
  }
}