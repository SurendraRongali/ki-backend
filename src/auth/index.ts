import { Express } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js';

export function setupAuthRoutes(app: Express, db: NodePgDatabase<typeof schema>) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Local Strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email));

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Please use social login' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with Google ID
        let [user] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.googleId, profile.id));

        if (!user) {
          // Check if user exists with same email
          [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, profile.emails?.[0]?.value || ''));

          if (user) {
            // Link Google account to existing user
            await db
              .update(schema.users)
              .set({ googleId: profile.id })
              .where(eq(schema.users.id, user.id));
          } else {
            // Create new user
            const [newUser] = await db
              .insert(schema.users)
              .values({
                googleId: profile.id,
                email: profile.emails?.[0]?.value || '',
                username: profile.emails?.[0]?.value?.split('@')[0] || profile.displayName || '',
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                isActive: true
              })
              .returning();
            user = newUser;
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Auth routes
  app.post('/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Login successful', user: req.user });
  });

  app.post('/auth/register', async (req, res) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required' });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email,
          password: hashedPassword,
          username,
          firstName: firstName || '',
          lastName: lastName || '',
          isActive: true
        })
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
    (req, res) => {
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
  );

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json({ authenticated: true, user: userWithoutPassword });
    } else {
      res.json({ authenticated: false });
    }
  });
}