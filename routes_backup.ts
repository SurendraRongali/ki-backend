import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertArticleSchema, insertCategorySchema, insertNewsletterSchema } from "./shared/schema";

// Stripe will be initialized when keys are provided
let stripe: any = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Articles
  app.get("/api/articles", async (req, res) => {
    try {
      const { limit = "20", offset = "0", category, search, premium } = req.query;
      const userId = (req.user as any)?.claims?.sub;

      let categoryId: number | undefined;
      if (category && typeof category === "string") {
        const cat = await storage.getCategoryBySlug(category);
        categoryId = cat?.id;
      }

      const articles = await storage.getArticles({
        limit: parseInt(limit as string),
        offset,
        categoryId,
        searchQuery: search as string,
        isPremium: premium === "true" ? true : premium === "false" ? false : undefined,
        userId,
      });

      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      const userId = (req.user as any)?.claims?.sub;

      // Generate title based on slug for better demo experience
      const titles: Record<string, string> = {
        "evercore-citi-vistra-stake-acquisition": "Evercore, Citi: Advisory on Vistra's 15% Stake Acquisition in Vistra Vision for $3.2bn",
        "ubs-advisory-affinity-equity": "UBS Advisory: Affinity Equity Partners to Acquire Lumus Imaging From Healius for AUD965m",
        "hsbc-yonghui-superstore-acquisition": "HSBC Exclusive: Advisory on £670m Yonghui Superstore Stake Acquisition Explained",
        "oaktree-capital-close-brothers": "Oaktree Capital: £200m Acquisition of Close Brothers Asset Management From...",
        "barclays-powerfleet-acquisition": "Barclays, Centerview Partners: Advisory on Powerfleet's $200m Acquisition"
      };
      
      const demoTitle = titles[identifier] || "Goldman Sachs, Rothschild & Co: Advisory on Uranium Energy's Strategic Acquisition";
      
      const article = {
        id: 1,
        title: demoTitle,
        slug: identifier,
        content: `
          <p>Technological advancements are particularly impactful, reshaping how we manage our health, interact with our environments, and make travel and style decisions. This constant evolution encourages us to adapt and thrive in a world where change is the only constant.</p>
          
          <p>By integrating innovative tools and apps into our routines, we can enhance efficiency and enjoyment in every aspect of life. Technological advancements are particularly impactful, reshaping how we manage our health, interact with our environments, and make travel and style decisions.</p>
          
          <h2>Lorem ipsum heading</h2>
          
          <p>Technological advancements are particularly impactful, reshaping how we manage our health, interact with our environments, and make travel and style decisions. This constant evolution encourages us to adapt and thrive in a world where change is the only constant. By integrating innovative tools and apps into our routines, we can enhance efficiency and enjoyment in every aspect of life.</p>
          
          <p>Technological advancements are particularly impactful, reshaping how we manage our health, interact with our environments, and make travel and style decisions. This constant evolution encourages us to adapt and thrive in a world where change is the only constant. By integrating innovative tools and apps into our routines, we can enhance efficiency and enjoyment in every aspect of life.</p>
          
          <h2>Impact on Financial Markets</h2>
          
          <p>Goldman Sachs and Rothschild & Co have played pivotal roles as financial advisors in Uranium Energy Corp's (UEC) strategic acquisition. The transaction represents a significant milestone in the energy sector, highlighting the growing importance of uranium in the global energy transition.</p>
          
          <p>This deal underscores the strategic value of uranium assets in today's market environment, where clean energy solutions are becoming increasingly critical. The advisory work provided by these leading investment banks demonstrates the complexity and scale of modern energy transactions.</p>
        `,
        excerpt: "Goldman Sachs and Rothschild & Co have played pivotal roles as financial advisors in Uranium Energy Corp's strategic acquisition of Rio Tinto's Sweetwater uranium project.",
        isPremium: false,
        isPublished: true,
        views: 1247,
        readTime: 5,
        imageUrl: null,
        dealSize: null,
        companies: null,
        tags: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: "1",
        categoryId: 1,
        author: {
          id: "1",
          email: "bianca.silva@krugmaninsights.com",
          firstName: "Bianca",
          lastName: "Silva",
          profileImageUrl: null,
          subscriptionTier: "premium",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: "active",
          subscriptionEndDate: null,
          monthlyArticleCount: 0,
          lastArticleReset: new Date(),
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        category: {
          id: 1,
          name: "Investment Banking",
          slug: "investment-banking",
          description: null,
          color: null,
          createdAt: new Date()
        },
        isSaved: false
      };

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}