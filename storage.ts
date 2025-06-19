import {
  users,
  articles,
  categories,
  savedArticles,
  articleViews,
  newsletters,
  orders,
  purchasedArticles,
  corporateAccounts,
  corporateUsers,
  corporateInvitations,
  podcasts,
  studentVerifications,
  studentVerificationCodes,
  firmsData,
  articlePurchases,
  passwordResetTokens,
  photoLibrary,
  emailUnsubscribes,
  notifications,
  type User,
  type UpsertUser,
  type Article,
  type InsertArticle,
  type Category,
  type InsertCategory,
  type SavedArticle,
  type InsertSavedArticle,
  type Newsletter,
  type InsertNewsletter,
  type Order,
  type ArticleWithDetails,
  type CorporateAccount,
  type InsertCorporateAccount,
  type CorporateUser,
  type StudentVerificationCode,
  type InsertCorporateUser,
  type CorporateInvitation,
  type InsertCorporateInvitation,
  type Podcast,
  type InsertPodcast,
  type PodcastWithAuthor,
  type StudentVerification,
  type InsertStudentVerification,
  type FirmData,
  type InsertFirmData,
  type ArticlePurchase,
  type InsertArticlePurchase,
  type PhotoLibrary,
  type InsertPhotoLibrary,
  type EmailUnsubscribe,
  type InsertEmailUnsubscribe,
  type Notification,
  type InsertNotification,
} from "./shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, like, or, gte, lte, gt, lt, inArray, ne, count, not, notInArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { invalidateCache } from "./cache";
import dotenv from 'dotenv';
dotenv.config();

export interface IStorage {
  sessionStore: session.Store;
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: {
    subscriptionTier: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus: string;
    subscriptionEndDate?: Date;
  }): Promise<User>;
  incrementUserArticleCount(userId: string): Promise<void>;
  resetMonthlyArticleCount(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsers(): Promise<User[]>; // Alias for health monitoring compatibility
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  getUserPreferences(userId: string): Promise<any>;
  updateUserPreferences(userId: string, preferences: any): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
  
  // Password reset operations
  storePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  
  // Student verification operations
  storeStudentVerification(email: string, code: string): Promise<void>;
  verifyStudentCode(email: string, code: string): Promise<boolean>;
  
  // Student verification code operations
  createVerificationCode(email: string, firstName: string, code: string, expiresAt: Date): Promise<StudentVerificationCode>;
  getValidVerificationCode(email: string, code: string): Promise<StudentVerificationCode | undefined>;
  markVerificationCodeAsUsed(id: number): Promise<void>;
  cleanupExpiredVerificationCodes(): Promise<void>;
  getRecentVerificationAttempts(email: string, timeWindow: number): Promise<number>;
  
  // Article purchase operations
  createPurchasedArticle(userId: string, articleId: number, orderId?: number, price?: string): Promise<void>;
  getUserPurchasedArticles(userId: string): Promise<number[]>;
  hasUserPurchasedArticle(userId: string, articleId: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Article operations
  getScheduledArticles(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<ArticleWithDetails[]>;
  getArticles(options?: {
    limit?: number;
    offset?: number;
    categoryId?: number;
    isPremium?: boolean;
    isPublished?: boolean;
    searchQuery?: string;
    userId?: string; // for checking saved status
  }): Promise<ArticleWithDetails[]>;
  getArticleBySlug(slug: string, userId?: string): Promise<ArticleWithDetails | undefined>;
  searchArticles(query: string, limit?: number): Promise<ArticleWithDetails[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
  incrementArticleViews(articleId: number): Promise<void>;
  getRecommendedArticles(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Featured article operations
  getFeaturedArticle(): Promise<ArticleWithDetails | null>;
  setFeaturedArticle(articleId: number, isFeatured: boolean): Promise<Article>;
  
  // Today's Most Read operations
  getTodaysMostRead(): Promise<ArticleWithDetails[]>;
  
  // Trending Now operations (excludes Opinions, Rankings, Career Development, Industry Reports)
  getTrendingNow(): Promise<ArticleWithDetails[]>;
  
  // Landing page section operations
  getRankingsArticles(): Promise<ArticleWithDetails[]>;
  getMAArticles(): Promise<ArticleWithDetails[]>;
  getPrivateEquityArticles(): Promise<ArticleWithDetails[]>;
  getArticlesByCategory(categoryNameOrSlug: string): Promise<ArticleWithDetails[]>;
  getSpotlightArticle(): Promise<ArticleWithDetails | null>;
  getLatestNews(categorySlug?: string, limit?: number): Promise<ArticleWithDetails[]>;
  getPopularSectorArticles(sector: string, limit?: number): Promise<ArticleWithDetails[]>;
  getTrendingNowArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getCareerDevelopmentArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getIndustryReportsArticles(limit?: number): Promise<ArticleWithDetails[]>;
  getOpinionsArticles(limit?: number): Promise<{ featured: ArticleWithDetails | null; list: ArticleWithDetails[] }>;
  getForYouArticles(userPreferences: any, limit?: number): Promise<{ topPick: ArticleWithDetails | null; recommended: ArticleWithDetails[] }>;
  getCategoryArticles(categorySlug: string, limit?: number): Promise<ArticleWithDetails[]>;
  getFirmArticles(firmName: string, limit?: number): Promise<ArticleWithDetails[]>;
  getSimilarArticles(articleId: number, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Saved articles
  saveArticle(userId: string, articleId: number): Promise<SavedArticle>;
  unsaveArticle(userId: string, articleId: number): Promise<void>;
  getSavedArticle(userId: string, articleId: number): Promise<SavedArticle | undefined>;
  getUserSavedArticles(userId: string, limit?: number): Promise<ArticleWithDetails[]>;
  
  // Article views
  trackArticleView(articleId: number, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  
  // Newsletter
  subscribeNewsletter(email: string): Promise<Newsletter>;
  unsubscribeNewsletter(email: string): Promise<void>;
  getAllNewsletters(): Promise<Newsletter[]>;
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  deleteNewsletter(id: number): Promise<void>;
  
  // Admin operations
  getUserStats(): Promise<{
    totalUsers: number;
    subscribedUsers: number;
    freeUsers: number;
  }>;
  getArticleStats(): Promise<{
    totalArticles: number;
    publishedArticles: number;
    premiumArticles: number;
  }>;
  getAllOrders(): Promise<Order[]>;
  
  // Analytics operations
  getRevenueMetrics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    subscriptionGrowth: number;
  }>;
  getUserEngagementMetrics(): Promise<{
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    articlesReadPerUser: number;
    topArticles: Array<{
      title: string;
      views: number;
      engagement: number;
    }>;
  }>;
  getContentMetrics(): Promise<{
    totalViews: number;
    averageViewsPerArticle: number;
    premiumContentViews: number;
    freeContentViews: number;
    categoryPerformance: Array<{
      category: string;
      views: number;
      articles: number;
    }>;
  }>;

  // Corporate operations
  getCorporateAccounts(): Promise<CorporateAccount[]>;
  getCorporateAccount(id: number): Promise<CorporateAccount | undefined>;
  createCorporateAccount(account: InsertCorporateAccount): Promise<CorporateAccount>;
  updateCorporateAccount(id: number, updates: Partial<InsertCorporateAccount>): Promise<CorporateAccount>;
  deleteCorporateAccount(id: number): Promise<void>;
  getCorporateUsers(corporateId: number): Promise<Array<CorporateUser & { user: User }>>;
  addCorporateUser(corporateId: number, userId: string, role?: string): Promise<CorporateUser>;
  removeCorporateUser(corporateId: number, userId: string): Promise<void>;
  updateCorporateUserRole(corporateId: number, userId: string, role: string): Promise<CorporateUser>;
  inviteCorporateUser(invitation: InsertCorporateInvitation): Promise<CorporateInvitation>;
  getCorporateInvitations(corporateId: number): Promise<CorporateInvitation[]>;
  acceptCorporateInvitation(token: string, userId: string): Promise<CorporateUser>;
  cancelCorporateInvitation(id: number): Promise<void>;
  updateCorporateUserCount(corporateId: number): Promise<void>;

  // Podcast operations
  getAllPodcasts(): Promise<PodcastWithAuthor[]>;
  getPodcast(id: number): Promise<PodcastWithAuthor | undefined>;
  createPodcast(data: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: number, data: Partial<InsertPodcast>): Promise<Podcast>;
  deletePodcast(id: number): Promise<void>;
  getLatestPodcasts(limit?: number): Promise<PodcastWithAuthor[]>;

  // Student verification operations
  storeStudentVerification(email: string, code: string): Promise<StudentVerification>;
  verifyStudentCode(email: string, code: string): Promise<boolean>;
  cleanupExpiredVerifications(): Promise<void>;

  // Firm data operations
  getAllFirmsData(): Promise<FirmData[]>;
  getFirmData(firmName: string): Promise<FirmData | undefined>;
  createFirmData(data: InsertFirmData): Promise<FirmData>;
  updateFirmData(firmName: string, data: Partial<InsertFirmData>): Promise<FirmData>;
  deleteFirmData(firmName: string): Promise<void>;

  // Article purchase operations
  createArticlePurchase(purchase: InsertArticlePurchase): Promise<ArticlePurchase>;
  getArticlePurchaseByEmail(email: string, articleId: number): Promise<ArticlePurchase | undefined>;
  getUserArticlePurchases(email: string): Promise<ArticlePurchase[]>;
  getArticleWithAuthor(id: number): Promise<ArticleWithDetails | undefined>;

  // User preferences operations for targeted email campaigns
  getUsersByPreference(type: 'companies' | 'industries' | 'sectors' | 'news', value: string): Promise<User[]>;

  // Photo library operations
  getPhotoLibrary(): Promise<PhotoLibrary[]>;
  getPhotoById(id: number): Promise<PhotoLibrary | undefined>;
  createPhoto(photo: InsertPhotoLibrary): Promise<PhotoLibrary>;
  updatePhoto(id: number, updates: Partial<InsertPhotoLibrary>): Promise<PhotoLibrary>;
  deletePhoto(id: number): Promise<void>;
  incrementPhotoUsage(id: number): Promise<void>;
  searchPhotos(query: string): Promise<PhotoLibrary[]>;

  // Email unsubscribe operations
  addToUnsubscribeList(email: string, reason?: string, ipAddress?: string): Promise<EmailUnsubscribe>;
  isEmailUnsubscribed(email: string): Promise<boolean>;
  removeFromUnsubscribeList(email: string): Promise<void>;
  getUnsubscribeList(): Promise<EmailUnsubscribe[]>;

  // Notifications operations
  createNotification(userId: string, articleId: number, title: string, message: string, type?: string, sector?: string, firm?: string): Promise<void>;
  getUserNotifications(userId: string, options?: { limit?: number; offset?: number; sector?: string; firm?: string; unreadOnly?: boolean }): Promise<any[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: number, userId: string): Promise<void>;
  markNotificationAsReadByArticle(articleId: number, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotificationsForNewArticle(article: ArticleWithDetails): Promise<void>;
}



export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    subscriptionTier: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus: string;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementUserArticleCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        articlesRead: sql`${users.articlesRead} + 1`,
        monthlyArticleCount: sql`${users.monthlyArticleCount} + 1`,
      })
      .where(eq(users.id, userId));
  }

  async resetMonthlyArticleCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Alias for health monitoring compatibility
  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  async updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async cancelUserSubscription(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        subscriptionEndDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upgradeUserSubscription(userId: string, tier: string, stripeData?: { customerId?: string; subscriptionId?: string }): Promise<User> {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const [user] = await db
      .update(users)
      .set({ 
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        stripeCustomerId: stripeData?.customerId,
        stripeSubscriptionId: stripeData?.subscriptionId,
        subscriptionEndDate: endDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<User> {
    // In a real app, you'd hash the password here
    const [user] = await db
      .update(users)
      .set({ 
        // passwordHash: hashPassword(newPassword), // Implement proper password hashing
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async suspendUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: 'suspended',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async reactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserPreferences(userId: string): Promise<any> {
    const [user] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.preferences || {};
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<User> {
    console.log(`[PREFERENCES-SAVE] Updating preferences for user ${userId}:`, JSON.stringify(preferences));
    
    const [user] = await db
      .update(users)
      .set({ 
        preferences: preferences,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`[PREFERENCES-SAVE] Successfully saved preferences for user ${userId}. Email: ${user.email}`);
    console.log(`[PREFERENCES-SAVE] Saved preferences data:`, JSON.stringify(user.preferences));
    
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getScheduledArticles(options: {
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}): Promise<ArticleWithDetails[]> {
    const { limit = 100, offset = 0, userId } = options;
    const now = new Date();

    const results = await db
      .select()
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          gt(articles.scheduledAt, now),
          eq(articles.isPublished, false)
        )
      )
      .orderBy(desc(articles.scheduledAt))
      .limit(limit)
      .offset(offset);

    return results.map(row => ({
      id: row.articles.id,
      title: row.articles.title,
      slug: row.articles.slug,
      excerpt: row.articles.excerpt,
      bulletPoint1: row.articles.bulletPoint1,
      bulletPoint2: row.articles.bulletPoint2,
      content: row.articles.content,
      imageUrl: row.articles.imageUrl,
      imageCaption: row.articles.imageCaption,
      featureImageUrl: row.articles.featureImageUrl,
      authorId: row.articles.authorId,
      authorName: row.articles.authorName,
      categoryId: row.articles.categoryId,
      categories: row.articles.categories,
      sector: row.articles.sector,
      industry: row.articles.industry,
      articleType: row.articles.articleType,
      dealSize: row.articles.dealSize,
      isPremium: row.articles.isPremium,
      isPublished: row.articles.isPublished,
      isFeatured: row.articles.isFeatured,
      isRanking: row.articles.isRanking,
      showOnHomeTop: row.articles.showOnHomeTop,
      publishedAt: row.articles.publishedAt,
      scheduledAt: row.articles.scheduledAt,
      readTime: row.articles.readTime,
      views: row.articles.views,
      companies: row.articles.companies,
      tags: row.articles.tags,
      createdAt: row.articles.createdAt,
      updatedAt: row.articles.updatedAt,
      author: row.users,
      category: row.categories,
      isSaved: false, // Simplified for scheduled articles
    }));
  }

  async getArticles(options: {
    limit?: number;
    offset?: number;
    categoryId?: number;
    isPremium?: boolean;
    isPublished?: boolean;
    searchQuery?: string;
    userId?: string;
  } = {}): Promise<ArticleWithDetails[]> {
    const {
      limit = 100,
      offset = 0,
      categoryId,
      isPremium,
      isPublished = true,
      searchQuery,
      userId,
    } = options;

    const conditions = [];
    
    // Only filter by isPublished if explicitly provided
    if (isPublished !== undefined) {
      conditions.push(eq(articles.isPublished, isPublished));
    }
    
    if (categoryId) {
      conditions.push(eq(articles.categoryId, categoryId));
    }
    
    if (isPremium !== undefined) {
      conditions.push(eq(articles.isPremium, isPremium));
    }
    
    if (searchQuery) {
      conditions.push(
        or(
          like(articles.title, `%${searchQuery}%`),
          like(articles.excerpt, `%${searchQuery}%`),
          like(articles.content, `%${searchQuery}%`)
        )!
      );
    }

    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        bulletPoint1: articles.bulletPoint1,
        bulletPoint2: articles.bulletPoint2,
        content: articles.content,
        imageUrl: articles.imageUrl,
        imageCaption: articles.imageCaption,
        featureImageUrl: articles.featureImageUrl,
        authorId: articles.authorId,
        authorName: articles.authorName,
        categoryId: articles.categoryId,
        categories: articles.categories,
        sector: articles.sector,
        industry: articles.industry,
        articleType: articles.articleType,
        dealSize: articles.dealSize,
        isPremium: articles.isPremium,
        isPublished: articles.isPublished,
        isFeatured: articles.isFeatured,
        isRanking: articles.isRanking,
        showOnHomeTop: articles.showOnHomeTop,
        publishedAt: articles.publishedAt,
        scheduledAt: articles.scheduledAt,
        readTime: articles.readTime,
        views: articles.views,
        companies: articles.companies,
        tags: articles.tags,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        author: users,
        category: categories,
        isSaved: userId ? sql<boolean>`CASE WHEN ${savedArticles.id} IS NOT NULL THEN true ELSE false END` : sql<boolean>`false`,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id));

    if (userId) {
      query = query.leftJoin(
        savedArticles,
        and(eq(savedArticles.articleId, articles.id), eq(savedArticles.userId, userId))
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
    

    
    // Debug: Log the first result to see field structure
    if (results.length > 0) {
      const firstResult = results[0];
      console.log(`DEBUG Storage: First article - ID: ${firstResult.id}, title: ${firstResult.title}, scheduledAt: ${firstResult.scheduledAt}, type: ${typeof firstResult.scheduledAt}`);
    }
    
    return results.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      bulletPoint1: row.bulletPoint1,
      bulletPoint2: row.bulletPoint2,
      content: row.content,
      imageUrl: row.imageUrl,
      imageCaption: row.imageCaption,
      featureImageUrl: row.featureImageUrl,
      authorId: row.authorId,
      authorName: row.authorName,
      categoryId: row.categoryId,
      categories: row.categories,
      sector: row.sector,
      industry: row.industry,
      articleType: row.articleType,
      dealSize: row.dealSize,
      isPremium: row.isPremium,
      isPublished: row.isPublished,
      isFeatured: row.isFeatured,
      isRanking: row.isRanking,
      showOnHomeTop: row.showOnHomeTop,
      publishedAt: row.publishedAt,
      scheduledAt: row.scheduledAt,
      readTime: row.readTime,
      views: row.views,
      companies: row.companies,
      tags: row.tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author || {
        id: 'unknown',
        email: 'unknown@example.com',
        username: 'Unknown Author'
      },
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async getArticleBySlug(slug: string, userId?: string): Promise<ArticleWithDetails | undefined> {
    try {
      const results = await db
        .select()
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(eq(articles.slug, slug));

      if (results.length === 0) return undefined;

      const row = results[0];
      
      // Extract and merge all the data properly
      const articleWithDetails = {
        ...row.articles,
        author: row.users || { id: 'unknown', email: 'unknown@example.com', username: 'Unknown Author' },
        category: row.categories || { id: 0, name: 'Uncategorized', slug: 'uncategorized' },
        isSaved: false,
      };
      
      return articleWithDetails;
    } catch (error) {
      console.log('Database query failed for slug:', slug, error);
      return undefined;
    }
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values({
      ...article,
      publishedAt: article.isPublished ? new Date() : null,
    }).returning();
    
    // If this article is marked for show on home top, invalidate featured article cache
    if (article.showOnHomeTop && article.isPublished) {
      this.clearFeaturedArticleCache();
    }
    
    return newArticle;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    // Check if this update affects showOnHomeTop or publishing status
    const shouldClearCache = updates.showOnHomeTop !== undefined || updates.isPublished !== undefined || updates.isFeatured !== undefined;
    
    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...updates,
        updatedAt: new Date(),
        publishedAt: updates.isPublished ? new Date() : undefined,
      })
      .where(eq(articles.id, id))
      .returning();
    
    // Clear featured article cache if showOnHomeTop, featured status, or publishing status changed
    if (shouldClearCache) {
      this.clearFeaturedArticleCache();
      console.log(`[FEATURED ARTICLE] Cache cleared for article ${id} update:`, {
        showOnHomeTop: updates.showOnHomeTop,
        isFeatured: updates.isFeatured,
        isPublished: updates.isPublished
      });
    }
    
    return updatedArticle;
  }

  // Cache invalidation method for featured articles
  clearFeaturedArticleCache(): void {
    try {
      invalidateCache.smart('articles');
      console.log('[FEATURED ARTICLE] Cache cleared successfully - home page will show most recent articles');
    } catch (error) {
      console.error('[FEATURED ARTICLE] Failed to clear cache:', error);
    }
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async searchArticles(query: string, limit = 20): Promise<ArticleWithDetails[]> {
    const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return [];
    }

    const results = await db
      .select({
        article: articles,
        author: users,
        category: categories,
        isSaved: sql<boolean>`false`,
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(
        and(
          eq(articles.isPublished, true),
          or(
            ...searchTerms.map(term => 
              or(
                sql`${articles.title} ILIKE ${`%${term}%`}`,
                sql`${articles.content} ILIKE ${`%${term}%`}`,
                sql`${articles.excerpt} ILIKE ${`%${term}%`}`,
                sql`${categories.name} ILIKE ${`%${term}%`}`
              )
            )
          )
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return results.map(row => ({
      ...row.article,
      author: row.author,
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async incrementArticleViews(articleId: number): Promise<void> {
    await db
      .update(articles)
      .set({
        views: sql`${articles.views} + 1`,
      })
      .where(eq(articles.id, articleId));
  }

  async getRecommendedArticles(userId: string, limit = 10): Promise<ArticleWithDetails[]> {
    // Simple recommendation: get articles from categories the user has read
    const userSavedCategories = await db
      .select({ categoryId: articles.categoryId })
      .from(savedArticles)
      .innerJoin(articles, eq(savedArticles.articleId, articles.id))
      .where(eq(savedArticles.userId, userId))
      .groupBy(articles.categoryId);

    const categoryIds = userSavedCategories.map(row => row.categoryId);

    if (categoryIds.length === 0) {
      // If no saved articles, return popular articles
      return this.getArticles({ limit, isPublished: true });
    }

    return this.getArticles({
      limit,
      isPublished: true,
      userId,
    });
  }

  async saveArticle(userId: string, articleId: number): Promise<SavedArticle> {
    const [savedArticle] = await db
      .insert(savedArticles)
      .values({ userId, articleId })
      .returning();
    return savedArticle;
  }

  async getSavedArticle(userId: string, articleId: number): Promise<SavedArticle | undefined> {
    const [savedArticle] = await db
      .select()
      .from(savedArticles)
      .where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)))
      .limit(1);
    return savedArticle;
  }

  async unsaveArticle(userId: string, articleId: number): Promise<void> {
    await db
      .delete(savedArticles)
      .where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)));
  }

  // Related articles methods for the new feature
  async getArticlesByCategory(categorySlug: string, options: {
    publishedAfter?: Date;
    excludeIds?: number[];
    limit?: number;
  } = {}): Promise<ArticleWithDetails[]> {
    const { publishedAfter, excludeIds = [], limit = 10 } = options;
    
    const conditions = [
      eq(articles.isPublished, true),
      eq(categories.slug, categorySlug)
    ];
    
    if (publishedAfter) {
      conditions.push(gte(articles.publishedAt, publishedAfter));
    }
    
    if (excludeIds.length > 0) {
      conditions.push(notInArray(articles.id, excludeIds));
    }

    const results = await db
      .select({
        article: articles,
        author: users,
        category: categories,
        isSaved: sql<boolean>`false`,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return results.map(row => ({
      ...row.article,
      author: row.author,
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async getArticlesByCompanies(companies: string[], options: {
    excludeIds?: number[];
    limit?: number;
  } = {}): Promise<ArticleWithDetails[]> {
    const { excludeIds = [], limit = 10 } = options;
    
    const conditions = [eq(articles.isPublished, true)];
    
    if (excludeIds.length > 0) {
      conditions.push(notInArray(articles.id, excludeIds));
    }

    // Create OR conditions for each company
    const companyConditions = companies.map(company => 
      sql`${articles.companies} ? ${company}`
    );

    const results = await db
      .select({
        article: articles,
        author: users,
        category: categories,
        isSaved: sql<boolean>`false`,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions, or(...companyConditions)))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return results.map(row => ({
      ...row.article,
      author: row.author,
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async getArticlesBySector(sector: string, options: {
    publishedAfter?: Date;
    excludeIds?: number[];
    limit?: number;
  } = {}): Promise<ArticleWithDetails[]> {
    const { publishedAfter, excludeIds = [], limit = 10 } = options;
    
    const conditions = [
      eq(articles.isPublished, true),
      like(articles.sector, `%${sector}%`)
    ];
    
    if (publishedAfter) {
      conditions.push(gte(articles.publishedAt, publishedAfter));
    }
    
    if (excludeIds.length > 0) {
      conditions.push(notInArray(articles.id, excludeIds));
    }

    const results = await db
      .select({
        article: articles,
        author: users,
        category: categories,
        isSaved: sql<boolean>`false`,
      })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return results.map(row => ({
      ...row.article,
      author: row.author,
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async getUserSavedArticles(userId: string, limit = 20): Promise<ArticleWithDetails[]> {
    const results = await db
      .select({
        article: articles,
        author: users,
        category: categories,
        isSaved: sql<boolean>`true`,
      })
      .from(savedArticles)
      .innerJoin(articles, eq(savedArticles.articleId, articles.id))
      .innerJoin(users, eq(articles.authorId, users.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(savedArticles.userId, userId))
      .orderBy(desc(savedArticles.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.article,
      author: row.author,
      category: row.category,
      isSaved: row.isSaved,
    }));
  }

  async trackArticleView(articleId: number, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await db.insert(articleViews).values({
      articleId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async subscribeNewsletter(email: string): Promise<Newsletter> {
    const [newsletter] = await db
      .insert(newsletters)
      .values({ email })
      .onConflictDoUpdate({
        target: newsletters.email,
        set: { isSubscribed: true, updatedAt: new Date() },
      })
      .returning();
    return newsletter;
  }

  async unsubscribeNewsletter(email: string): Promise<void> {
    await db
      .update(newsletters)
      .set({ isSubscribed: false, updatedAt: new Date() })
      .where(eq(newsletters.email, email));
  }

  async getAllNewsletters(): Promise<Newsletter[]> {
    return await db
      .select()
      .from(newsletters)
      .orderBy(desc(newsletters.createdAt));
  }

  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const [created] = await db
      .insert(newsletters)
      .values(newsletter)
      .returning();
    return created;
  }

  async deleteNewsletter(id: number): Promise<void> {
    await db
      .delete(newsletters)
      .where(eq(newsletters.id, id));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    subscribedUsers: number;
    freeUsers: number;
  }> {
    const [stats] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        subscribedUsers: sql<number>`count(*) filter (where subscription_tier in ('student', 'monthly', 'annual'))`,
        freeUsers: sql<number>`count(*) filter (where subscription_tier = 'free')`,
      })
      .from(users);

    return stats;
  }

  async getArticleStats(): Promise<{
    totalArticles: number;
    publishedArticles: number;
    premiumArticles: number;
  }> {
    const [stats] = await db
      .select({
        totalArticles: sql<number>`count(*)`,
        publishedArticles: sql<number>`count(*) filter (where is_published = true)`,
        premiumArticles: sql<number>`count(*) filter (where is_premium = true)`,
      })
      .from(articles);

    return stats;
  }

  async getRevenueMetrics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    subscriptionGrowth: number;
  }> {
    // Get counts by subscription tier
    const [tierCounts] = await db
      .select({
        studentCount: sql<number>`count(*) filter (where subscription_tier = 'student')`,
        monthlyCount: sql<number>`count(*) filter (where subscription_tier = 'monthly')`,
        annualCount: sql<number>`count(*) filter (where subscription_tier = 'annual')`,
        totalCount: sql<number>`count(*)`
      })
      .from(users);

    const studentCount = tierCounts?.studentCount || 0;
    const monthlyCount = tierCounts?.monthlyCount || 0;
    const annualCount = tierCounts?.annualCount || 0;
    const totalCount = tierCounts?.totalCount || 1;
    
    // Calculate monthly revenue based on actual pricing:
    // Student: £7.99/month, Monthly: £14.99/month, Annual: £119.99/year (£10/month)
    const monthlyRevenue = (studentCount * 7.99) + (monthlyCount * 14.99) + (annualCount * 10);
    const totalRevenue = monthlyRevenue * 12;
    const averageRevenuePerUser = totalRevenue / totalCount;

    // Calculate growth based on recent subscriptions
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const [recentSubscriptions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`subscription_tier in ('student', 'monthly', 'annual')`,
        gte(users.updatedAt, oneMonthAgo)
      ));

    const subscribedCount = studentCount + monthlyCount + annualCount;
    const subscriptionGrowth = subscribedCount > 0 ? 
      ((recentSubscriptions?.count || 0) / subscribedCount) * 100 : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      averageRevenuePerUser,
      subscriptionGrowth,
    };
  }

  async getUserEngagementMetrics(): Promise<{
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    articlesReadPerUser: number;
    topArticles: Array<{
      title: string;
      views: number;
      engagement: number;
    }>;
  }> {
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [totalViews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articleViews);

    const totalUserCount = totalUsers?.count || 0;
    const totalViewCount = totalViews?.count || 0;

    // Get unique users who viewed articles in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const [dailyActive] = await db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(articleViews)
      .where(gte(articleViews.createdAt, oneDayAgo));

    // Get unique users who viewed articles in last 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    const [monthlyActive] = await db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(articleViews)
      .where(gte(articleViews.createdAt, oneMonthAgo));

    // Get top articles by views
    const topArticlesData = await db
      .select({
        title: articles.title,
        views: articles.views,
      })
      .from(articles)
      .orderBy(desc(articles.views))
      .limit(5);

    const topArticles = topArticlesData.map(article => ({
      title: article.title,
      views: article.views,
      engagement: Math.floor(article.views * 0.15), // Engagement rate calculation
    }));

    return {
      dailyActiveUsers: dailyActive?.count || 0,
      monthlyActiveUsers: monthlyActive?.count || 0,
      averageSessionDuration: 8.5, // This would come from session tracking
      articlesReadPerUser: totalViewCount / (totalUserCount || 1),
      topArticles,
    };
  }

  async getContentMetrics(): Promise<{
    totalViews: number;
    averageViewsPerArticle: number;
    premiumContentViews: number;
    freeContentViews: number;
    categoryPerformance: Array<{
      category: string;
      views: number;
      articles: number;
    }>;
  }> {
    const [viewStats] = await db
      .select({ 
        totalViews: sql<number>`sum(${articles.views})`,
        count: sql<number>`count(*)`
      })
      .from(articles);

    const [premiumViews] = await db
      .select({ views: sql<number>`sum(${articles.views})` })
      .from(articles)
      .where(eq(articles.isPremium, true));

    const [freeViews] = await db
      .select({ views: sql<number>`sum(${articles.views})` })
      .from(articles)
      .where(eq(articles.isPremium, false));

    const categoryPerformance = await db
      .select({
        category: categories.name,
        views: sql<number>`sum(${articles.views})`,
        articles: sql<number>`count(${articles.id})`,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .groupBy(categories.name);

    const totalViews = viewStats?.totalViews || 0;
    const totalArticles = viewStats?.count || 1;

    return {
      totalViews,
      averageViewsPerArticle: totalViews / totalArticles,
      premiumContentViews: premiumViews?.views || 0,
      freeContentViews: freeViews?.views || 0,
      categoryPerformance: categoryPerformance.map(cat => ({
        category: cat.category || 'Uncategorized',
        views: cat.views || 0,
        articles: cat.articles || 0,
      })),
    };
  }

  // Featured article operations
  async getFeaturedArticle(): Promise<ArticleWithDetails | null> {
    // Get category IDs to exclude (Opinions, Rankings, Career Development, Industry Reports)
    const excludedCategories = await db
      .select()
      .from(categories)
      .where(or(
        eq(categories.slug, "opinions"),
        eq(categories.slug, "rankings"),
        eq(categories.slug, "career-development"),
        eq(categories.slug, "industry-reports")
      ));

    const excludedCategoryIds = excludedCategories.map(cat => cat.id);

    // First priority: Check for articles with showOnHomeTop = true
    let [article] = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.showOnHomeTop, true),
        eq(articles.isPublished, true),
        not(sql`LOWER(${articles.title}) LIKE '%edit%'`),
        excludedCategoryIds.length > 0 ? not(inArray(articles.categoryId, excludedCategoryIds)) : sql`1=1`
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(1);

    // Second priority: Get a featured article that's not in excluded categories and doesn't contain "edit"
    if (!article) {
      [article] = await db
        .select()
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(
          eq(articles.isFeatured, true),
          eq(articles.isPublished, true),
          not(sql`LOWER(${articles.title}) LIKE '%edit%'`),
          excludedCategoryIds.length > 0 ? not(inArray(articles.categoryId, excludedCategoryIds)) : sql`1=1`
        ))
        .orderBy(desc(articles.publishedAt))
        .limit(1);
    }

    // If no featured article found, fall back to latest published article not in excluded categories and without "edit"
    if (!article) {
      [article] = await db
        .select()
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(
          eq(articles.isPublished, true),
          not(sql`LOWER(${articles.title}) LIKE '%edit%'`),
          excludedCategoryIds.length > 0 ? not(inArray(articles.categoryId, excludedCategoryIds)) : sql`1=1`
        ))
        .orderBy(desc(articles.publishedAt))
        .limit(1);
    }

    if (!article) return null;

    return {
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        corporateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    };
  }

  async setFeaturedArticle(articleId: number, isFeatured: boolean): Promise<Article> {
    // If setting as featured, first unset any existing featured article
    if (isFeatured) {
      await db
        .update(articles)
        .set({ isFeatured: false })
        .where(eq(articles.isFeatured, true));
    }

    const [article] = await db
      .update(articles)
      .set({ isFeatured })
      .where(eq(articles.id, articleId))
      .returning();

    return article;
  }

  async getTodaysMostRead(): Promise<ArticleWithDetails[]> {
    // Get current date for seeding randomization
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Get articles from last 5 days from Investment Banking, Private Equity, Asset Management
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);

    // Get Investment Banking, Private Equity, Asset Management category IDs
    const targetCategories = await db
      .select()
      .from(categories)
      .where(or(
        eq(categories.slug, "investment-banking"),
        eq(categories.slug, "private-equity"),
        eq(categories.slug, "asset-management")
      ));

    const categoryIds = targetCategories.map(cat => cat.id);

    // Get featured article to exclude it
    const featuredArticle = await this.getFeaturedArticle();
    const featuredArticleId = featuredArticle?.id;

    // Get articles from last 5 days, excluding featured article
    const candidateArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        gte(articles.publishedAt, fiveDaysAgo),
        inArray(articles.categoryId, categoryIds),
        featuredArticleId ? ne(articles.id, featuredArticleId) : sql`1=1`
      ));

    // Use seeded random selection for consistent daily results
    const shuffled = candidateArticles
      .map((article, index) => ({ article, sort: Math.sin(dayOfYear + index) }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)
      .map(item => item.article);

    return shuffled.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    }));
  }

  // Trending Now operations (excludes Opinions, Rankings, Career Development, Industry Reports)
  async getTrendingNow(): Promise<ArticleWithDetails[]> {
    // Get current date for seeding randomization
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Get articles from last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Get category IDs to exclude (Opinions, Rankings, Career Development, Industry Reports)
    const excludedCategories = await db
      .select()
      .from(categories)
      .where(or(
        eq(categories.slug, "opinions"),
        eq(categories.slug, "rankings"),
        eq(categories.slug, "career-development"),
        eq(categories.slug, "industry-reports")
      ));

    const excludedCategoryIds = excludedCategories.map(cat => cat.id);

    // Get featured article to exclude it
    const featuredArticle = await this.getFeaturedArticle();
    const featuredArticleId = featuredArticle?.id;

    // Get articles from last 7 days, excluding featured article and excluded categories
    const candidateArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        gte(articles.publishedAt, sevenDaysAgo),
        excludedCategoryIds.length > 0 ? not(inArray(articles.categoryId, excludedCategoryIds)) : sql`1=1`,
        featuredArticleId ? ne(articles.id, featuredArticleId) : sql`1=1`
      ));

    // Use seeded random selection for consistent daily results
    const shuffled = candidateArticles
      .map((article, index) => ({ article, sort: Math.sin(dayOfYear * 2 + index) }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 6)
      .map(item => item.article);

    return shuffled.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        corporateId: null,
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    }));
  }

  // Get spotlight article (from last 3 days, Investment Banking or Private Equity, excluding Rankings/Opinions/Career Development/Industry Reports)
  async getSpotlightArticle(): Promise<ArticleWithDetails | null> {
    // Get current date for filtering
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    // Get featured article to exclude it
    const featuredArticle = await this.getFeaturedArticle();
    const featuredArticleId = featuredArticle?.id;

    // Get articles from last 3 days that meet criteria
    let whereConditions = [
      eq(articles.isPublished, true),
      gte(articles.publishedAt, threeDaysAgo),
      // Must be Investment Banking (id: 1) or Private Equity (id: 2)
      or(eq(articles.categoryId, 1), eq(articles.categoryId, 2)),
      // Cannot be Rankings (id: 4), Opinions (id: 6), Career Development (id: 7), Industry Reports (id: 8)
      not(inArray(articles.categoryId, [4, 6, 7, 8]))
    ];

    // Exclude featured article if it exists
    if (featuredArticleId) {
      whereConditions.push(ne(articles.id, featuredArticleId));
    }

    const candidateArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(articles.publishedAt));

    if (candidateArticles.length === 0) {
      return null; // No articles found
    }

    // Return the most recent article that meets criteria
    const article = candidateArticles[0];
    
    return {
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        corporateId: null,
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    };
  }

  // Landing page section operations
  async getRankingsArticles(): Promise<ArticleWithDetails[]> {
    // Get Rankings category
    const [rankingsCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "rankings"));

    if (!rankingsCategory) return [];

    const rankingsArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, rankingsCategory.id)
      ))
      .orderBy(desc(articles.publishedAt));

    return rankingsArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || rankingsCategory,
    }));
  }

  async getMAArticles(): Promise<ArticleWithDetails[]> {
    // Get M&A category
    const [maCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "mergers-acquisitions"));

    if (!maCategory) return [];

    // Get featured article to exclude it with offset
    const featuredArticle = await this.getFeaturedArticle();
    const featuredArticleId = featuredArticle?.id;

    // Get all potential M&A articles (including dual-tagged ones)
    const allMAArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        or(
          eq(articles.categoryId, maCategory.id),
          sql`${articles.tags}::text ILIKE '%M&A%'`,
          sql`${articles.tags}::text ILIKE '%Merger%'`,
          sql`${articles.tags}::text ILIKE '%Acquisition%'`,
          sql`${articles.sector} ILIKE '%M&A%'`,
          sql`${articles.title} ILIKE '%M&A%'`,
          sql`${articles.title} ILIKE '%Merger%'`,
          sql`${articles.title} ILIKE '%Acquisition%'`
        ),
        featuredArticleId ? ne(articles.id, featuredArticleId) : sql`1=1`
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(20); // Get more to allow for smart selection

    // Smart duplicate prevention: if article has both M&A and PE tags, randomly assign
    const finalMAArticles = [];
    const usedArticleIds = new Set();

    for (const article of allMAArticles) {
      if (finalMAArticles.length >= 4) break; // Increased to 4 to match Rankings
      
      const articleData = article.articles;
      const hasPrivateEquityTag = 
        articleData.tags?.some?.((tag: string) => 
          tag.toLowerCase().includes('private equity') || 
          tag.toLowerCase().includes('pe ')
        ) ||
        articleData.sector?.toLowerCase().includes('private equity') ||
        articleData.title?.toLowerCase().includes('private equity');

      // If has both M&A and PE tags, use deterministic random assignment
      if (hasPrivateEquityTag) {
        const articleHash = articleData.id + articleData.title.length;
        const isAssignedToMA = articleHash % 2 === 0; // Deterministic random
        if (!isAssignedToMA) continue; // Skip this article for M&A, will go to PE
      }

      if (!usedArticleIds.has(articleData.id)) {
        finalMAArticles.push(article);
        usedArticleIds.add(articleData.id);
      }
    }

    return finalMAArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || maCategory,
    }));
  }

  async getPrivateEquityArticles(): Promise<ArticleWithDetails[]> {
    // Get Private Equity category
    const [peCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "private-equity"));

    if (!peCategory) return [];

    // Get featured article to exclude it with offset
    const featuredArticle = await this.getFeaturedArticle();
    const featuredArticleId = featuredArticle?.id;

    // Get all potential PE articles (including dual-tagged ones)
    const allPEArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        or(
          eq(articles.categoryId, peCategory.id),
          sql`${articles.tags}::text ILIKE '%Private Equity%'`,
          sql`${articles.tags}::text ILIKE '%PE %'`,
          sql`${articles.tags}::text ILIKE '%Private Capital%'`,
          sql`${articles.sector} ILIKE '%Private Equity%'`,
          sql`${articles.title} ILIKE '%Private Equity%'`,
          sql`${articles.title} ILIKE '%PE %'`
        ),
        featuredArticleId ? ne(articles.id, featuredArticleId) : sql`1=1`
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(35); // Increased limit to ensure we get enough articles for selection

    // Smart duplicate prevention: if article has both M&A and PE tags, randomly assign
    const finalPEArticles = [];
    const usedArticleIds = new Set();

    for (const article of allPEArticles) {
      if (finalPEArticles.length >= 4) break;
      
      const articleData = article.articles;
      const hasMATag = 
        articleData.tags?.some?.((tag: string) => 
          tag.toLowerCase().includes('m&a') ||
          tag.toLowerCase().includes('merger') ||
          tag.toLowerCase().includes('acquisition')
        ) ||
        articleData.sector?.toLowerCase().includes('m&a') ||
        articleData.title?.toLowerCase().includes('m&a') ||
        articleData.title?.toLowerCase().includes('merger') ||
        articleData.title?.toLowerCase().includes('acquisition');

      // Smart duplicate prevention - avoid showing same dual-tagged articles in both sections
      if (hasMATag) {
        const articleHash = articleData.id + articleData.title.length;
        const isAssignedToPE = articleHash % 2 === 1; // Opposite logic from M&A
        if (!isAssignedToPE) continue; // Skip this article for PE, already assigned to M&A
      }

      if (!usedArticleIds.has(articleData.id)) {
        finalPEArticles.push(article);
        usedArticleIds.add(articleData.id);
      }
    }

    return finalPEArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || peCategory,
    }));
  }

  async getSpotlightArticle(): Promise<ArticleWithDetails | null> {
    // Optimized single-query approach to eliminate cascading delays
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    // Single optimized query with hardcoded category exclusions for speed
    // Excluded categories: Opinions (6), Rankings (4), Career Development (7), Industry Reports (8)
    const candidateArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        gte(articles.publishedAt, sixDaysAgo),
        // Exclude unwanted categories directly for performance
        not(inArray(articles.categoryId, [4, 6, 7, 8])),
        // Prefer core categories: Investment Banking (1), Private Equity (2), M&A (3)
        or(
          eq(articles.categoryId, 1),
          eq(articles.categoryId, 2), 
          eq(articles.categoryId, 3),
          eq(articles.categoryId, 5) // Asset Management
        )
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(20); // Limit for performance

    if (candidateArticles.length === 0) {
      // Fallback to any recent published article if no core category articles found
      const fallbackArticles = await db
        .select()
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(
          eq(articles.isPublished, true),
          not(inArray(articles.categoryId, [4, 6, 7, 8]))
        ))
        .orderBy(desc(articles.publishedAt))
        .limit(5);

      if (fallbackArticles.length === 0) return null;
      
      const selectedIndex = Math.abs(Math.sin(dayOfYear) * fallbackArticles.length) % fallbackArticles.length;
      const selectedArticle = fallbackArticles[Math.floor(selectedIndex)];
      
      return {
        ...selectedArticle.articles,
        author: selectedArticle.users || {
          id: "admin",
          email: null,
          firstName: "Editorial",
          lastName: "Team",
          profileImageUrl: null,
          country: null,
          subscriptionTier: "free",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: "inactive",
          subscriptionEndDate: null,
          articlesRead: 0,
          monthlyArticleCount: 0,
          lastArticleReset: new Date(),
          preferences: null,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        category: selectedArticle.categories || {
          id: 1,
          name: "Investment Banking",
          slug: "investment-banking",
          description: null,
          color: "#8B1538",
          createdAt: new Date(),
        },
      };
    }

    // Use seeded random selection for consistent daily results
    const selectedIndex = Math.abs(Math.sin(dayOfYear) * candidateArticles.length) % candidateArticles.length;
    const selectedArticle = candidateArticles[Math.floor(selectedIndex)];

    return {
      ...selectedArticle.articles,
      author: selectedArticle.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: selectedArticle.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    };
  }

  async getLatestNews(categorySlug?: string, limit: number = 10): Promise<ArticleWithDetails[]> {
    let query = db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.isPublished, true));

    // If category is specified, filter by it
    if (categorySlug && categorySlug !== 'all-categories') {
      const [targetCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug));

      if (targetCategory) {
        query = query.where(and(
          eq(articles.isPublished, true),
          eq(articles.categoryId, targetCategory.id)
        ));
      }
    }

    const latestArticles = await query
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return latestArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    }));
  }

  async getPopularSectorArticles(sector: string, limit: number = 6): Promise<ArticleWithDetails[]> {
    // Map sector names to their tag values - COMPLETE mapping for all sectors
    const sectorTagMap: Record<string, string> = {
      'tmt': 'TMT',
      'healthcare': 'Healthcare',
      'energy': 'Energy',
      'fig': 'FIG',
      'esg': 'ESG',
      'dcm': 'DCM',
      'ecm': 'ECM',
      'industrials': 'Industrials',
      'consumer-retail': 'Consumer & Retail',
      'real-estate': 'Real Estate'
    };

    const sectorTag = sectorTagMap[sector.toLowerCase()];
    if (!sectorTag) return [];

    // Find articles that have the specified sector either in tags OR sector field
    const sectorArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        or(
          sql`${articles.tags}::jsonb ? ${sectorTag}`,
          sql`${articles.sector} ILIKE ${'%' + sectorTag + '%'}`
        )
      ))
      .orderBy(desc(articles.publishedAt));

    // Filter out unwanted categories in memory
    const filteredSectorArticles = sectorArticles.filter(article => {
      const categorySlug = article.categories?.slug;
      return categorySlug !== "opinions" && 
             categorySlug !== "career-development" && 
             categorySlug !== "rankings";
    }).slice(0, limit);

    return filteredSectorArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    }));
  }

  async getTrendingNowArticles(limit: number = 6): Promise<ArticleWithDetails[]> {
    // Get date 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Get candidate articles from last 5 days, then filter out unwanted categories
    const candidateArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        gte(articles.publishedAt, fiveDaysAgo)
      ))
      .orderBy(desc(articles.publishedAt));

    // Filter out unwanted categories in memory
    const filteredArticles = candidateArticles.filter(article => {
      const categorySlug = article.categories?.slug;
      return categorySlug !== "opinions" && 
             categorySlug !== "career-development" && 
             categorySlug !== "industry-reports" && 
             categorySlug !== "rankings";
    });

    if (filteredArticles.length === 0) return [];

    // Use seeded random selection for consistent daily results
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Shuffle array using seeded randomization
    const shuffled = [...candidateArticles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(dayOfYear + i) * shuffled.length)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take the first `limit` articles from shuffled array
    const selectedArticles = shuffled.slice(0, limit);

    return selectedArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || {
        id: 1,
        name: "Investment Banking",
        slug: "investment-banking",
        description: null,
        color: "#8B1538",
        createdAt: new Date(),
      },
    }));
  }

  async getCareerDevelopmentArticles(limit: number = 10): Promise<ArticleWithDetails[]> {
    // Get Career Development category
    const [careerCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "career-development"));

    if (!careerCategory) return [];

    const careerArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, careerCategory.id)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return careerArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || careerCategory,
    }));
  }

  async getArticlesByCategory(categoryNameOrSlug: string): Promise<ArticleWithDetails[]> {
    // Get category by name or slug
    const [category] = await db
      .select()
      .from(categories)
      .where(or(
        eq(categories.name, categoryNameOrSlug),
        eq(categories.slug, categoryNameOrSlug)
      ));

    if (!category) return [];

    const categoryArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, category.id)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(10);

    return categoryArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        corporateId: null,
      },
      category: article.categories || category,
    }));
  }

  async getIndustryReportsArticles(limit: number = 10): Promise<ArticleWithDetails[]> {
    // Get Industry Reports category
    const [reportsCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "industry-reports"));

    if (!reportsCategory) return [];

    const reportsArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, reportsCategory.id)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return reportsArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || reportsCategory,
    }));
  }

  async getOpinionsArticles(limit: number = 4): Promise<{ featured: ArticleWithDetails | null; list: ArticleWithDetails[] }> {
    // Get Opinions category
    const [opinionsCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, "opinions"));

    if (!opinionsCategory) {
      return { featured: null, list: [] };
    }

    // Get all opinions articles sorted by most recent
    const opinionsArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, opinionsCategory.id)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    const formattedArticles = opinionsArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || opinionsCategory,
    }));

    // First article is featured (most recent), rest are for the list
    const featured = formattedArticles.length > 0 ? formattedArticles[0] : null;
    const list = formattedArticles.slice(1); // Skip first article (featured)

    return { featured, list };
  }

  async getForYouArticles(userPreferences: any, limit: number = 10): Promise<{ topPick: ArticleWithDetails | null; recommended: ArticleWithDetails[] }> {
    if (!userPreferences || !userPreferences.industries || userPreferences.industries.length === 0) {
      return { topPick: null, recommended: [] };
    }

    // Get all categories that match user preferences
    const preferenceCategories = await db
      .select()
      .from(categories)
      .where(
        or(
          ...userPreferences.industries.map((industry: string) => 
            eq(categories.name, industry)
          )
        )
      );

    if (preferenceCategories.length === 0) {
      return { topPick: null, recommended: [] };
    }

    // Priority order: Investment Banking > Private Equity > Asset Management
    const priorityOrder = ["Investment Banking", "Private Equity", "Asset Management"];
    const priorityCategories = preferenceCategories.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.name);
      const bIndex = priorityOrder.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Get Today's Top Pick - most recent from highest priority category
    let topPick: ArticleWithDetails | null = null;
    for (const category of priorityCategories) {
      const topPickArticles = await db
        .select()
        .from(articles)
        .leftJoin(users, eq(articles.authorId, users.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(
          eq(articles.isPublished, true),
          eq(articles.categoryId, category.id)
        ))
        .orderBy(desc(articles.publishedAt))
        .limit(1);

      if (topPickArticles.length > 0) {
        topPick = {
          ...topPickArticles[0].articles,
          author: topPickArticles[0].users || {
            id: "admin",
            email: null,
            firstName: "Editorial",
            lastName: "Team",
            profileImageUrl: null,
            country: null,
            subscriptionTier: "free",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: "inactive",
            subscriptionEndDate: null,
            articlesRead: 0,
            monthlyArticleCount: 0,
            lastArticleReset: new Date(),
            preferences: null,
            corporateId: null,
            isAdmin: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          category: topPickArticles[0].categories || category,
        };
        break;
      }
    }

    // Get recommended articles from all preference categories, excluding top pick
    const recommendedArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        or(
          ...preferenceCategories.map(category => 
            eq(articles.categoryId, category.id)
          )
        ),
        topPick ? ne(articles.id, topPick.id) : undefined // Exclude top pick
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    const recommended = recommendedArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories!,
    }));

    return { topPick, recommended };
  }

  async getCategoryArticles(categorySlug: string, limit: number = 20): Promise<ArticleWithDetails[]> {
    // Get category by slug
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug));

    if (!category) return [];

    // Get articles sorted by most recent
    const categoryArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        eq(articles.categoryId, category.id)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return categoryArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories || category,
    }));
  }

  async getFirmArticles(firmName: string, limit: number = 20): Promise<ArticleWithDetails[]> {
    // Get articles that mention the firm name in title, content, or companies field, sorted by most recent
    const firmArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        or(
          like(articles.title, `%${firmName}%`),
          like(articles.excerpt, `%${firmName}%`),
          like(articles.content, `%${firmName}%`),
          sql`${articles.companies}::text LIKE ${`%${firmName}%`}`
        )
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    return firmArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories!,
    }));
  }

  async getSimilarArticles(articleId: number, limit: number = 6): Promise<ArticleWithDetails[]> {
    // First get the current article to find its category and tags
    const [currentArticle] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId));

    if (!currentArticle) return [];

    // Find similar articles based on category and tags, excluding the current article
    const similarArticles = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.isPublished, true),
        ne(articles.id, articleId), // Exclude current article
        or(
          eq(articles.categoryId, currentArticle.categoryId), // Same category
          currentArticle.tags && currentArticle.tags.length > 0 
            ? or(
                ...currentArticle.tags.map((tag: string) => 
                  sql`${articles.tags} @> ${JSON.stringify([tag])}`
                )
              )
            : undefined // Similar tags
        )
      ))
      .orderBy(desc(articles.publishedAt)) // Most recent first
      .limit(limit);

    return similarArticles.map(article => ({
      ...article.articles,
      author: article.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: article.categories!,
    }));
  }

  // Corporate operations implementation
  async getCorporateAccounts(): Promise<CorporateAccount[]> {
    return await db.select().from(corporateAccounts).orderBy(desc(corporateAccounts.createdAt));
  }

  async getCorporateAccount(id: number): Promise<CorporateAccount | undefined> {
    const [account] = await db.select().from(corporateAccounts).where(eq(corporateAccounts.id, id));
    return account;
  }

  async createCorporateAccount(account: InsertCorporateAccount): Promise<CorporateAccount> {
    const [newAccount] = await db.insert(corporateAccounts).values(account).returning();
    return newAccount;
  }

  async updateCorporateAccount(id: number, updates: Partial<InsertCorporateAccount>): Promise<CorporateAccount> {
    const [updated] = await db
      .update(corporateAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporateAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteCorporateAccount(id: number): Promise<void> {
    // Remove all corporate users first
    await db.delete(corporateUsers).where(eq(corporateUsers.corporateId, id));
    // Remove all invitations
    await db.delete(corporateInvitations).where(eq(corporateInvitations.corporateId, id));
    // Remove corporate account
    await db.delete(corporateAccounts).where(eq(corporateAccounts.id, id));
  }

  async getCorporateUsers(corporateId: number): Promise<Array<CorporateUser & { user: User }>> {
    const corporateUsersList = await db
      .select({
        corporateUser: corporateUsers,
        user: users,
      })
      .from(corporateUsers)
      .leftJoin(users, eq(corporateUsers.userId, users.id))
      .where(eq(corporateUsers.corporateId, corporateId));

    return corporateUsersList.map(row => ({
      ...row.corporateUser,
      user: row.user!,
    }));
  }

  async addCorporateUser(corporateId: number, userId: string, role: string = "member"): Promise<CorporateUser> {
    // Check if user is already in this corporate account
    const existingUser = await db
      .select()
      .from(corporateUsers)
      .where(and(eq(corporateUsers.corporateId, corporateId), eq(corporateUsers.userId, userId)));
    
    if (existingUser.length > 0) {
      throw new Error("User is already part of this corporate account");
    }

    // Add user to corporate account
    const [newCorporateUser] = await db
      .insert(corporateUsers)
      .values({
        corporateId,
        userId,
        role,
        status: "active",
        acceptedAt: new Date(),
      })
      .returning();

    // Update user's corporate ID
    await db.update(users).set({ corporateId }).where(eq(users.id, userId));

    // Update corporate account user count
    await this.updateCorporateUserCount(corporateId);

    return newCorporateUser;
  }

  async removeCorporateUser(corporateId: number, userId: string): Promise<void> {
    // Remove from corporate users
    await db
      .delete(corporateUsers)
      .where(and(eq(corporateUsers.corporateId, corporateId), eq(corporateUsers.userId, userId)));

    // Remove corporate ID from user
    await db.update(users).set({ corporateId: null }).where(eq(users.id, userId));

    // Update corporate account user count
    await this.updateCorporateUserCount(corporateId);
  }

  async updateCorporateUserRole(corporateId: number, userId: string, role: string): Promise<CorporateUser> {
    const [updated] = await db
      .update(corporateUsers)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(corporateUsers.corporateId, corporateId), eq(corporateUsers.userId, userId)))
      .returning();
    return updated;
  }

  async inviteCorporateUser(invitation: InsertCorporateInvitation): Promise<CorporateInvitation> {
    // Generate unique invitation token
    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newInvitation] = await db
      .insert(corporateInvitations)
      .values({
        ...invitation,
        invitationToken: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();

    return newInvitation;
  }

  async getCorporateInvitations(corporateId: number): Promise<CorporateInvitation[]> {
    return await db
      .select()
      .from(corporateInvitations)
      .where(eq(corporateInvitations.corporateId, corporateId))
      .orderBy(desc(corporateInvitations.createdAt));
  }

  async acceptCorporateInvitation(token: string, userId: string): Promise<CorporateUser> {
    // Find the invitation
    const [invitation] = await db
      .select()
      .from(corporateInvitations)
      .where(eq(corporateInvitations.invitationToken, token));

    if (!invitation) {
      throw new Error("Invalid invitation token");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation has already been processed");
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error("Invitation has expired");
    }

    // Add user to corporate account
    const corporateUser = await this.addCorporateUser(invitation.corporateId, userId, invitation.role);

    // Mark invitation as accepted
    await db
      .update(corporateInvitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(corporateInvitations.id, invitation.id));

    return corporateUser;
  }

  async cancelCorporateInvitation(id: number): Promise<void> {
    await db
      .update(corporateInvitations)
      .set({ status: "cancelled" })
      .where(eq(corporateInvitations.id, id));
  }

  async updateCorporateUserCount(corporateId: number): Promise<void> {
    const [result] = await db
      .select({ count: count() })
      .from(corporateUsers)
      .where(and(eq(corporateUsers.corporateId, corporateId), eq(corporateUsers.status, "active")));

    await db
      .update(corporateAccounts)
      .set({ currentUsers: result.count })
      .where(eq(corporateAccounts.id, corporateId));
  }

  async getAllOrders(): Promise<Order[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return allOrders;
  }

  async verifyCorporateInvitation(token: string): Promise<{ email: string; role: string | null; corporateName: string; expiresAt: Date } | null> {
    const [invitation] = await db
      .select({
        email: corporateInvitations.email,
        role: corporateInvitations.role,
        expiresAt: corporateInvitations.expiresAt,
        corporateName: corporateAccounts.name,
      })
      .from(corporateInvitations)
      .leftJoin(corporateAccounts, eq(corporateInvitations.corporateId, corporateAccounts.id))
      .where(and(
        eq(corporateInvitations.invitationToken, token),
        eq(corporateInvitations.status, "pending"),
        gte(corporateInvitations.expiresAt, new Date())
      ));

    return invitation || null;
  }

  async acceptCorporateInvitation(token: string, password: string): Promise<User | null> {
    // Find the invitation
    const [invitation] = await db
      .select()
      .from(corporateInvitations)
      .where(and(
        eq(corporateInvitations.invitationToken, token),
        eq(corporateInvitations.status, "pending"),
        gte(corporateInvitations.expiresAt, new Date())
      ));

    if (!invitation) {
      return null;
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email));

    if (existingUser) {
      // Update existing user with corporate membership
      const [updatedUser] = await db
        .update(users)
        .set({ 
          corporateId: invitation.corporateId,
          subscriptionTier: "corporate",
          subscriptionStatus: "active",
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      // Add to corporate users table
      await db
        .insert(corporateUsers)
        .values({
          corporateId: invitation.corporateId,
          userId: existingUser.id,
          role: invitation.role || "member",
          status: "active",
          acceptedAt: new Date(),
        });

      // Mark invitation as accepted
      await db
        .update(corporateInvitations)
        .set({ 
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(corporateInvitations.id, invitation.id));

      // Update corporate user count
      await this.updateCorporateUserCount(invitation.corporateId);

      return updatedUser;
    } else {
      // Create new user
      const userId = `corp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: invitation.email,
          firstName: invitation.email.split('@')[0], // Use email prefix as first name initially
          lastName: "User",
          corporateId: invitation.corporateId,
          subscriptionTier: "corporate",
          subscriptionStatus: "active",
          password: password, // In a real app, this should be hashed
        })
        .returning();

      // Add to corporate users table
      await db
        .insert(corporateUsers)
        .values({
          corporateId: invitation.corporateId,
          userId: newUser.id,
          role: invitation.role || "member",
          status: "active",
          acceptedAt: new Date(),
        });

      // Mark invitation as accepted
      await db
        .update(corporateInvitations)
        .set({ 
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(corporateInvitations.id, invitation.id));

      // Update corporate user count
      await this.updateCorporateUserCount(invitation.corporateId);

      return newUser;
    }
  }

  // User operations for article purchase
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        ...userData,
        corporateId: null, // Set default value for corporateId
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // Article purchase operations
  async createPurchasedArticle(userId: string, articleId: number, orderId?: number, price?: string): Promise<void> {
    await db.insert(purchasedArticles).values({
      userId,
      articleId,
      orderId,
      purchasePrice: price,
      purchasedAt: new Date(),
    });
  }

  async getUserPurchasedArticles(userId: string): Promise<number[]> {
    const purchases = await db
      .select({ articleId: purchasedArticles.articleId })
      .from(purchasedArticles)
      .where(eq(purchasedArticles.userId, userId));
    
    return purchases.map(p => p.articleId);
  }

  async hasUserPurchasedArticle(userId: string, articleId: number): Promise<boolean> {
    const [purchase] = await db
      .select()
      .from(purchasedArticles)
      .where(and(
        eq(purchasedArticles.userId, userId),
        eq(purchasedArticles.articleId, articleId)
      ))
      .limit(1);
    
    return !!purchase;
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    
    return article;
  }

  // Student verification operations
  async storeStudentVerification(email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    studentVerificationCodes.set(email, { code, expiresAt });
  }

  async verifyStudentCode(email: string, code: string): Promise<boolean> {
    const stored = studentVerificationCodes.get(email);
    if (!stored) return false;
    
    // Check if code has expired
    if (new Date() > stored.expiresAt) {
      studentVerificationCodes.delete(email);
      return false;
    }
    
    // Check if code matches
    if (stored.code === code) {
      studentVerificationCodes.delete(email); // Remove after successful verification
      return true;
    }
    
    return false;
  }

  // Podcast operations
  async getAllPodcasts(): Promise<PodcastWithAuthor[]> {
    const result = await db
      .select()
      .from(podcasts)
      .leftJoin(users, eq(podcasts.authorId, users.id))
      .orderBy(desc(podcasts.publishedAt));

    return result.map(row => ({
      ...row.podcasts,
      author: row.users!
    }));
  }

  async getPodcast(id: number): Promise<PodcastWithAuthor | undefined> {
    const result = await db
      .select()
      .from(podcasts)
      .leftJoin(users, eq(podcasts.authorId, users.id))
      .where(eq(podcasts.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].podcasts,
      author: result[0].users!
    };
  }

  async createPodcast(data: InsertPodcast): Promise<Podcast> {
    const [podcast] = await db.insert(podcasts).values(data).returning();
    return podcast;
  }

  async updatePodcast(id: number, data: Partial<InsertPodcast>): Promise<Podcast> {
    const [podcast] = await db
      .update(podcasts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(podcasts.id, id))
      .returning();
    return podcast;
  }

  async deletePodcast(id: number): Promise<void> {
    await db.delete(podcasts).where(eq(podcasts.id, id));
  }

  async getLatestPodcasts(limit?: number): Promise<PodcastWithAuthor[]> {
    const result = await db
      .select()
      .from(podcasts)
      .leftJoin(users, eq(podcasts.authorId, users.id))
      .where(eq(podcasts.isPublished, true))
      .orderBy(desc(podcasts.publishedAt))
      .limit(limit || 10);

    return result.map(row => ({
      ...row.podcasts,
      author: row.users!
    }));
  }

  // Student verification methods
  async storeStudentVerification(email: string, code: string): Promise<StudentVerification> {
    // Clean up any existing codes for this email first
    await db.delete(studentVerifications).where(eq(studentVerifications.email, email));

    // Store new verification code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const [verification] = await db
      .insert(studentVerifications)
      .values({ email, code, expiresAt })
      .returning();
    
    return verification;
  }

  async verifyStudentCode(email: string, code: string): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(studentVerifications)
      .where(and(
        eq(studentVerifications.email, email),
        eq(studentVerifications.code, code),
        eq(studentVerifications.verified, false)
      ))
      .limit(1);

    if (!verification) {
      return false;
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      // Clean up expired code
      await db.delete(studentVerifications).where(eq(studentVerifications.id, verification.id));
      return false;
    }

    // Mark as verified and return success
    await db
      .update(studentVerifications)
      .set({ verified: true })
      .where(eq(studentVerifications.id, verification.id));

    return true;
  }

  async cleanupExpiredVerifications(): Promise<void> {
    await db
      .delete(studentVerifications)
      .where(lte(studentVerifications.expiresAt, new Date()));
  }

  // Firm data operations
  async getAllFirmsData(): Promise<FirmData[]> {
    // Select all fields to ensure complete firm data is returned
    return await db.select().from(firmsData).orderBy(firmsData.firmName);
  }

  async getFirmData(firmName: string): Promise<FirmData | undefined> {
    const [firmData] = await db
      .select()
      .from(firmsData)
      .where(eq(firmsData.firmName, firmName))
      .limit(1);
    return firmData;
  }

  async createFirmData(data: InsertFirmData): Promise<FirmData> {
    const [newFirmData] = await db
      .insert(firmsData)
      .values(data)
      .returning();
    return newFirmData;
  }

  async updateFirmData(firmName: string, data: Partial<InsertFirmData>): Promise<FirmData> {
    console.log("Storage: updateFirmData called with:", { firmName, data });
    
    try {
      const [updatedFirmData] = await db
        .update(firmsData)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(firmsData.firmName, firmName))
        .returning();
      
      if (!updatedFirmData) {
        throw new Error(`No firm found with name: ${firmName}`);
      }
      
      console.log("Storage: updateFirmData succeeded:", updatedFirmData);
      return updatedFirmData;
    } catch (error) {
      console.error("Storage: updateFirmData failed:", error);
      throw error;
    }
  }

  async deleteFirmData(firmName: string): Promise<void> {
    await db.delete(firmsData).where(eq(firmsData.firmName, firmName));
  }

  // Article purchase operations
  async createArticlePurchase(purchase: InsertArticlePurchase): Promise<ArticlePurchase> {
    const [newPurchase] = await db
      .insert(articlePurchases)
      .values(purchase)
      .returning();
    return newPurchase;
  }

  async getArticlePurchaseByEmail(email: string, articleId: number): Promise<ArticlePurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(articlePurchases)
      .where(and(
        eq(articlePurchases.customerEmail, email),
        eq(articlePurchases.articleId, articleId),
        eq(articlePurchases.status, 'completed')
      ))
      .limit(1);
    return purchase;
  }

  async getUserArticlePurchases(email: string): Promise<ArticlePurchase[]> {
    return await db
      .select()
      .from(articlePurchases)
      .where(and(
        eq(articlePurchases.customerEmail, email),
        eq(articlePurchases.status, 'completed')
      ))
      .orderBy(desc(articlePurchases.createdAt));
  }

  async getArticleWithAuthor(id: number): Promise<ArticleWithDetails | undefined> {
    const result = await db
      .select()
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.articles,
      author: row.users || {
        id: "admin",
        email: null,
        firstName: "Editorial",
        lastName: "Team",
        profileImageUrl: null,
        country: null,
        subscriptionTier: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        subscriptionEndDate: null,
        articlesRead: 0,
        monthlyArticleCount: 0,
        lastArticleReset: new Date(),
        preferences: null,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        corporateId: null,
      },
      category: row.categories!,
    };
  }

  // Student verification code operations
  async createVerificationCode(email: string, firstName: string, code: string, expiresAt: Date): Promise<StudentVerificationCode> {
    const [verificationCode] = await db
      .insert(studentVerificationCodes)
      .values({
        email,
        firstName,
        code,
        expiresAt,
      })
      .returning();
    return verificationCode;
  }

  async getValidVerificationCode(email: string, code: string): Promise<StudentVerificationCode | undefined> {
    const [verificationCode] = await db
      .select()
      .from(studentVerificationCodes)
      .where(and(
        eq(studentVerificationCodes.email, email),
        eq(studentVerificationCodes.code, code),
        eq(studentVerificationCodes.isUsed, false),
        gt(studentVerificationCodes.expiresAt, new Date())
      ))
      .orderBy(desc(studentVerificationCodes.createdAt))
      .limit(1);
    
    return verificationCode;
  }

  async markVerificationCodeAsUsed(id: number): Promise<void> {
    await db
      .update(studentVerificationCodes)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(eq(studentVerificationCodes.id, id));
  }

  async cleanupExpiredVerificationCodes(): Promise<void> {
    await db
      .delete(studentVerificationCodes)
      .where(lt(studentVerificationCodes.expiresAt, new Date()));
  }

  async getRecentVerificationAttempts(email: string, timeWindow: number = 60000): Promise<number> {
    const windowStart = new Date(Date.now() - timeWindow);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentVerificationCodes)
      .where(and(
        eq(studentVerificationCodes.email, email),
        gt(studentVerificationCodes.createdAt, windowStart)
      ));

    return result[0]?.count || 0;
  }

  // User preferences operations for targeted email campaigns
  async getUsersByPreference(type: 'companies' | 'industries' | 'sectors' | 'news', value: string): Promise<User[]> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(sql`preferences->'${sql.raw(type)}' @> '[${sql.raw(`"${value}"`)}]'`);
      
      return result;
    } catch (error) {
      console.error('Error fetching users by preference:', error);
      return [];
    }
  }

  // Password reset operations
  async storePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    
    if (!resetToken) return undefined;
    
    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt,
    };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateFirm(firmId: number, updates: Partial<FirmData>): Promise<FirmData> {
    const [updatedFirm] = await db
      .update(firmsData)
      .set(updates)
      .where(eq(firmsData.id, firmId))
      .returning();
    
    if (!updatedFirm) {
      throw new Error(`Firm with id ${firmId} not found`);
    }
    
    return updatedFirm;
  }

  // Photo library operations
  async getPhotoLibrary(): Promise<PhotoLibrary[]> {
    try {
      return await db
        .select()
        .from(photoLibrary)
        .orderBy(desc(photoLibrary.createdAt));
    } catch (error) {
      console.error('Failed to fetch photo library:', error);
      throw new Error('Unable to retrieve photo library');
    }
  }

  async getPhotoById(id: number): Promise<PhotoLibrary | undefined> {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid photo ID provided');
      }
      
      const [photo] = await db
        .select()
        .from(photoLibrary)
        .where(eq(photoLibrary.id, id))
        .limit(1);
      return photo;
    } catch (error) {
      console.error(`Failed to fetch photo ${id}:`, error);
      throw new Error('Unable to retrieve photo');
    }
  }

  async createPhoto(photo: InsertPhotoLibrary): Promise<PhotoLibrary> {
    try {
      // Validate required fields
      if (!photo.fileName || !photo.originalName || !photo.url || !photo.title) {
        throw new Error('Missing required photo fields');
      }

      // Validate file size and type
      if (photo.fileSize && photo.fileSize > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      if (photo.mimeType && !photo.mimeType.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Use transaction for consistency
      const [newPhoto] = await db.transaction(async (tx) => {
        return await tx
          .insert(photoLibrary)
          .values({
            ...photo,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      });

      return newPhoto;
    } catch (error) {
      console.error('Failed to create photo:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unable to save photo');
    }
  }

  async updatePhoto(id: number, updates: Partial<InsertPhotoLibrary>): Promise<PhotoLibrary> {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid photo ID provided');
      }

      // Check if photo exists
      const existingPhoto = await this.getPhotoById(id);
      if (!existingPhoto) {
        throw new Error('Photo not found');
      }

      const [updatedPhoto] = await db.transaction(async (tx) => {
        return await tx
          .update(photoLibrary)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(photoLibrary.id, id))
          .returning();
      });

      if (!updatedPhoto) {
        throw new Error('Failed to update photo');
      }

      return updatedPhoto;
    } catch (error) {
      console.error(`Failed to update photo ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unable to update photo');
    }
  }

  async deletePhoto(id: number): Promise<void> {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid photo ID provided');
      }

      // Check if photo exists
      const existingPhoto = await this.getPhotoById(id);
      if (!existingPhoto) {
        throw new Error('Photo not found');
      }

      await db.transaction(async (tx) => {
        await tx.delete(photoLibrary).where(eq(photoLibrary.id, id));
      });
    } catch (error) {
      console.error(`Failed to delete photo ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unable to delete photo');
    }
  }

  async incrementPhotoUsage(id: number): Promise<void> {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid photo ID provided');
      }

      await db.transaction(async (tx) => {
        await tx
          .update(photoLibrary)
          .set({ 
            usageCount: sql`${photoLibrary.usageCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(photoLibrary.id, id));
      });
    } catch (error) {
      console.error(`Failed to increment usage for photo ${id}:`, error);
      throw new Error('Unable to update photo usage');
    }
  }

  async searchPhotos(query: string): Promise<PhotoLibrary[]> {
    return await db
      .select()
      .from(photoLibrary)
      .where(
        or(
          like(photoLibrary.caption, `%${query}%`),
          like(photoLibrary.filename, `%${query}%`)
        )
      )
      .orderBy(desc(photoLibrary.createdAt));
  }

  // Email unsubscribe operations
  async addToUnsubscribeList(email: string, reason?: string, ipAddress?: string): Promise<EmailUnsubscribe> {
    try {
      const [unsubscribe] = await db
        .insert(emailUnsubscribes)
        .values({
          email: email.toLowerCase().trim(),
          reason,
          ipAddress
        })
        .onConflictDoUpdate({
          target: emailUnsubscribes.email,
          set: {
            unsubscribedAt: new Date(),
            reason: reason || sql`${emailUnsubscribes.reason}`,
            ipAddress: ipAddress || sql`${emailUnsubscribes.ipAddress}`
          }
        })
        .returning();
      
      console.log(`Email ${email} added to unsubscribe list`);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to add email to unsubscribe list:', error);
      throw new Error('Unable to process unsubscribe request');
    }
  }

  async isEmailUnsubscribed(email: string): Promise<boolean> {
    try {
      const [result] = await db
        .select({ id: emailUnsubscribes.id })
        .from(emailUnsubscribes)
        .where(eq(emailUnsubscribes.email, email.toLowerCase().trim()))
        .limit(1);
      
      return !!result;
    } catch (error) {
      console.error('Failed to check unsubscribe status:', error);
      return false; // Fail safe - allow email if check fails
    }
  }

  async removeFromUnsubscribeList(email: string): Promise<void> {
    try {
      await db
        .delete(emailUnsubscribes)
        .where(eq(emailUnsubscribes.email, email.toLowerCase().trim()));
      
      console.log(`Email ${email} removed from unsubscribe list`);
    } catch (error) {
      console.error('Failed to remove email from unsubscribe list:', error);
      throw new Error('Unable to process resubscribe request');
    }
  }

  async getUnsubscribeList(): Promise<EmailUnsubscribe[]> {
    try {
      return await db
        .select()
        .from(emailUnsubscribes)
        .orderBy(desc(emailUnsubscribes.unsubscribedAt));
    } catch (error) {
      console.error('Failed to fetch unsubscribe list:', error);
      return [];
    }
  }

  // ===== NOTIFICATIONS METHODS =====

  async createNotification(userId: string, articleId: number, title: string, message: string, type: string = 'article', sector?: string, firm?: string): Promise<void> {
    try {
      await db.insert(notifications).values({
        userId,
        articleId,
        title,
        message,
        type,
        sector,
        firm,
        isRead: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error('Unable to create notification');
    }
  }

  async getUserNotifications(userId: string, options: { limit?: number; offset?: number; sector?: string; firm?: string; unreadOnly?: boolean } = {}): Promise<any[]> {
    try {
      const { limit = 20, offset = 0, sector, firm, unreadOnly = false } = options;

      const conditions = [eq(notifications.userId, userId)];

      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      if (sector) {
        conditions.push(eq(notifications.sector, sector));
      }

      if (firm) {
        conditions.push(eq(notifications.firm, firm));
      }

      const query = db
        .select({
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          sector: notifications.sector,
          firm: notifications.firm,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          article: {
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            imageUrl: articles.imageUrl,
            category: categories.name,
            categoryId: articles.categoryId
          }
        })
        .from(notifications)
        .leftJoin(articles, eq(notifications.articleId, articles.id))
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(and(...conditions))

      return await query
        .orderBy(desc(notifications.createdAt))
        .limit(Math.min(limit, 20)) // Cap limit for performance
        .offset(offset);
    } catch (error) {
      console.error('Failed to fetch user notifications:', error);
      return [];
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  }

  async markNotificationAsRead(notificationId: number, userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error('Unable to mark notification as read');
    }
  }

  async markNotificationAsReadByArticle(articleId: number, userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.articleId, articleId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    } catch (error) {
      console.error('Failed to mark notifications as read by article:', error);
      throw new Error('Unable to mark notifications as read');
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new Error('Unable to mark all notifications as read');
    }
  }

  async createNotificationsForNewArticle(article: ArticleWithDetails): Promise<void> {
    try {
      // Only create notifications for published premium articles
      if (!article.isPublished || !article.isPremium) {
        return;
      }

      // Get all premium users (monthly or annual subscribers with active status)
      const premiumUsers = await db
        .select()
        .from(users)
        .where(and(
          inArray(users.subscriptionTier, ['monthly', 'annual']),
          eq(users.subscriptionStatus, 'active')
        ));

      if (premiumUsers.length === 0) {
        return;
      }

      // Extract meaningful content for notification message
      let extractedMessage = article.excerpt || '';
      
      if (article.content) {
        // First try to find "What you need to know" section with bullet points
        const whatYouNeedMatch = article.content.match(/what you need to know[:\s]*\n*\s*[•\-\*]\s*([^\n•\-\*]+)/i);
        if (whatYouNeedMatch) {
          extractedMessage = whatYouNeedMatch[1].trim();
        } else {
          // Fallback: Use the first sentence from the first paragraph
          const firstParagraph = article.content.split('\n\n')[0];
          if (firstParagraph) {
            // Extract first sentence
            const firstSentence = firstParagraph.split('.')[0];
            if (firstSentence && firstSentence.length > 20) {
              extractedMessage = firstSentence + '.';
            }
          }
        }
        
        // Limit message length for notifications
        if (extractedMessage.length > 120) {
          extractedMessage = extractedMessage.substring(0, 117) + '...';
        }
      }
      
      // Final fallback if no meaningful content found
      if (!extractedMessage || extractedMessage.length < 20) {
        extractedMessage = `New article: ${article.title}`;
      }

      // Use the actual article title for notifications
      const smartTitle = article.title;

      // Create notifications for users based on their preferences
      const notificationsToCreate = [];

      for (const user of premiumUsers) {
        let shouldNotify = false;
        let notificationMessage = extractedMessage;

        // Check user preferences if they exist
        if (user.preferences) {
          const preferences = typeof user.preferences === 'string' 
            ? JSON.parse(user.preferences) 
            : user.preferences;

          // Check if article matches user's sector interests
          if (preferences?.sectors?.length > 0 && article.sector) {
            const userSectors = preferences.sectors.map((s: string) => s.toLowerCase());
            const articleSectors = article.sector.split(',').map(s => s.trim().toLowerCase());
            const sectorMatch = articleSectors.some(sector => 
              userSectors.some(userSector => 
                sector.includes(userSector) || userSector.includes(sector)
              )
            );
            
            if (sectorMatch) {
              shouldNotify = true;
              notificationMessage = `New ${article.sector.split(',')[0].trim()} article: ${article.title}`;
            }
          }

          // Check if article mentions companies user follows
          if (preferences?.companies?.length > 0 && article.companies?.length > 0) {
            const userCompanies = preferences.companies.map((c: string) => c.toLowerCase());
            const articleCompanies = article.companies.map((c: string) => c.toLowerCase());
            const matchingCompanies = userCompanies.filter(company => 
              articleCompanies.some(articleCompany => 
                articleCompany.includes(company) || company.includes(articleCompany)
              )
            );

            if (matchingCompanies.length > 0) {
              shouldNotify = true;
              notificationMessage = `New article about ${preferences.companies.find(c => 
                matchingCompanies.some(mc => c.toLowerCase().includes(mc))
              )}: ${article.title}`;
            }
          }
        }
        // REMOVED: No longer notify users without preferences set

        if (shouldNotify) {
          // Smart sector selection based on user preferences
          let selectedSector = null;
          if (article.sector) {
            const articleSectors = article.sector.split(',').map(s => s.trim());
            
            if (user.preferences) {
              const preferences = typeof user.preferences === 'string' 
                ? JSON.parse(user.preferences) 
                : user.preferences;
              
              // Find first sector that matches user's preferences
              if (preferences?.sectors?.length > 0) {
                const userSectors = preferences.sectors.map((s: string) => s.toLowerCase());
                selectedSector = articleSectors.find(sector => 
                  userSectors.some(userSector => 
                    sector.toLowerCase().includes(userSector.toLowerCase()) ||
                    userSector.toLowerCase().includes(sector.toLowerCase())
                  )
                );
              }
            }
            
            // If no user preference match, use first sector
            if (!selectedSector && articleSectors.length > 0) {
              selectedSector = articleSectors[0];
            }
          }

          // Smart firm selection based on user preferences
          let selectedFirm = null;
          if (companies.length > 0) {
            if (user.preferences) {
              const preferences = typeof user.preferences === 'string' 
                ? JSON.parse(user.preferences) 
                : user.preferences;
              
              // Find first company that matches user's preferences
              if (preferences?.companies?.length > 0) {
                const userCompanies = preferences.companies.map((c: string) => c.toLowerCase());
                selectedFirm = companies.find(company => 
                  userCompanies.some(userCompany => 
                    company.toLowerCase().includes(userCompany.toLowerCase()) ||
                    userCompany.toLowerCase().includes(company.toLowerCase())
                  )
                );
              }
            }
            
            // If no user preference match, use first company
            if (!selectedFirm) {
              selectedFirm = companies[0];
            }
          }

          notificationsToCreate.push({
            userId: user.id,
            articleId: article.id,
            title: smartTitle,
            message: extractedMessage,
            type: 'article',
            sector: selectedSector,
            firm: selectedFirm,
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      // Batch insert notifications
      if (notificationsToCreate.length > 0) {
        await db.insert(notifications).values(notificationsToCreate);
        console.log(`Created ${notificationsToCreate.length} notifications for article: ${article.title}`);
      }
    } catch (error) {
      console.error('Failed to create notifications for new article:', error);
      // Don't throw error to prevent article creation failure
    }
  }
}

export const storage = new DatabaseStorage();
