import { Express } from 'express';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js';

export function setupApiRoutes(app: Express, db: NodePgDatabase<typeof schema>) {
  // Articles endpoints
  app.get('/api/articles', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const articles = await db
        .select()
        .from(schema.articles)
        .where(eq(schema.articles.isPublished, true))
        .orderBy(desc(schema.articles.publishedAt))
        .limit(limit)
        .offset(offset);
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/articles/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [article] = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.id, id),
          eq(schema.articles.isPublished, true)
        ));
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      // Increment view count
      await db
        .update(schema.articles)
        .set({ views: sql`${schema.articles.views} + 1` })
        .where(eq(schema.articles.id, id));
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.get('/api/articles/slug/:slug', async (req, res) => {
    try {
      const [article] = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.slug, req.params.slug),
          eq(schema.articles.isPublished, true)
        ));
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching article by slug:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Featured content endpoints
  app.get('/api/featured', async (req, res) => {
    try {
      const [featured] = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.isFeatured, true),
          eq(schema.articles.isPublished, true)
        ))
        .orderBy(desc(schema.articles.publishedAt))
        .limit(1);
      
      res.json(featured || null);
    } catch (error) {
      console.error('Error fetching featured article:', error);
      res.status(500).json({ error: 'Failed to fetch featured article' });
    }
  });

  app.get('/api/spotlight', async (req, res) => {
    try {
      const [spotlight] = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.isSpotlight, true),
          eq(schema.articles.isPublished, true)
        ))
        .orderBy(desc(schema.articles.publishedAt))
        .limit(1);
      
      res.json(spotlight || null);
    } catch (error) {
      console.error('Error fetching spotlight article:', error);
      res.status(500).json({ error: 'Failed to fetch spotlight article' });
    }
  });

  // Trending and popular content
  app.get('/api/trending-now', async (req, res) => {
    try {
      const trending = await db
        .select()
        .from(schema.articles)
        .where(eq(schema.articles.isPublished, true))
        .orderBy(desc(sql`${schema.articles.views} + ${schema.articles.likes}`))
        .limit(10);
      
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ error: 'Failed to fetch trending articles' });
    }
  });

  app.get('/api/todays-most-read', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mostRead = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.isPublished, true),
          sql`${schema.articles.publishedAt} >= ${today}`
        ))
        .orderBy(desc(schema.articles.views))
        .limit(10);
      
      res.json(mostRead);
    } catch (error) {
      console.error('Error fetching most read articles:', error);
      res.status(500).json({ error: 'Failed to fetch most read articles' });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(schema.categories)
        .orderBy(schema.categories.name);
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.get('/api/categories/:slug/articles', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const [category] = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, req.params.slug));
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      const articles = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.categoryId, category.id),
          eq(schema.articles.isPublished, true)
        ))
        .orderBy(desc(schema.articles.publishedAt))
        .limit(limit)
        .offset(offset);
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching category articles:', error);
      res.status(500).json({ error: 'Failed to fetch category articles' });
    }
  });

  // Search
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const searchTerm = `%${query}%`;
      const articles = await db
        .select()
        .from(schema.articles)
        .where(and(
          eq(schema.articles.isPublished, true),
          or(
            like(schema.articles.title, searchTerm),
            like(schema.articles.content, searchTerm),
            like(schema.articles.excerpt, searchTerm)
          )
        ))
        .orderBy(desc(schema.articles.publishedAt))
        .limit(50);
      
      res.json(articles);
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({ error: 'Failed to search articles' });
    }
  });

  // Firms
  app.get('/api/firms', async (req, res) => {
    try {
      const firms = await db
        .select()
        .from(schema.firms)
        .where(eq(schema.firms.isActive, true))
        .orderBy(schema.firms.name);
      
      res.json(firms);
    } catch (error) {
      console.error('Error fetching firms:', error);
      res.status(500).json({ error: 'Failed to fetch firms' });
    }
  });

  // Newsletter subscription
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if already subscribed
      const [existing] = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.email, email));
      
      if (existing) {
        return res.status(409).json({ error: 'Email already subscribed' });
      }
      
      await db
        .insert(schema.subscriptions)
        .values({
          email,
          type: 'newsletter',
          isActive: true
        });
      
      res.json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
  });

  // Contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }
      
      await db
        .insert(schema.contactMessages)
        .values({
          name,
          email,
          subject: subject || 'Contact Form Submission',
          message
        });
      
      res.json({ message: 'Contact message sent successfully' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({ error: 'Failed to submit contact form' });
    }
  });

  // User authentication status
  app.get('/api/user', (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}