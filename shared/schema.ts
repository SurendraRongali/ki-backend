import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  //(table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // hashed password for email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  country: varchar("country"),
  subscriptionTier: varchar("subscription_tier").default("free").notNull(), // free, monthly, annual
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"), // active, inactive, canceled
  subscriptionEndDate: timestamp("subscription_end_date"),
  articlesRead: integer("articles_read").default(0),
  monthlyArticleCount: integer("monthly_article_count").default(0),
  lastArticleReset: timestamp("last_article_reset").defaultNow(),
  preferences: jsonb("preferences"), // interests, categories, etc.
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  corporateId: integer("corporate_id"), // Reference to corporate account
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin accounts table for secure authentication
export const adminAccounts = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // hashed
  phoneNumber: varchar("phone_number").notNull(), // for SMS 2FA
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS verification codes for 2FA
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminAccounts.id).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin sessions for authenticated access
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminAccounts.id).notNull(),
  sessionToken: varchar("session_token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student verification codes table
export const studentVerificationCodes = pgTable("student_verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  code: varchar("code").notNull(),
  firstName: varchar("first_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
});

// Corporate accounts table
export const corporateAccounts = pgTable("corporate_accounts", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  companyEmail: varchar("company_email").notNull().unique(),
  contactPersonName: varchar("contact_person_name").notNull(),
  contactPersonEmail: varchar("contact_person_email").notNull(),
  contactPersonPhone: varchar("contact_person_phone"),
  companyAddress: text("company_address"),
  industry: varchar("industry"),
  companySize: varchar("company_size"), // Small, Medium, Large, Enterprise
  subscriptionTier: varchar("subscription_tier").default("corporate_basic").notNull(), // corporate_basic, corporate_premium, corporate_enterprise
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("active"), // active, inactive, suspended, cancelled
  subscriptionStartDate: timestamp("subscription_start_date").defaultNow(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  maxUsers: integer("max_users").default(10), // Maximum number of users allowed
  currentUsers: integer("current_users").default(0), // Current number of active users
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }),
  billingCycle: varchar("billing_cycle").default("monthly"), // monthly, annual
  features: jsonb("features"), // Array of enabled features
  customSettings: jsonb("custom_settings"), // Custom configurations
  notes: text("notes"), // Admin notes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Corporate users junction table
export const corporateUsers = pgTable("corporate_users", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").default("member"), // admin, manager, member
  invitedBy: varchar("invited_by"), // User ID who sent the invitation
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status").default("pending"), // pending, active, suspended, removed
  permissions: jsonb("permissions"), // Custom permissions for this user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Corporate invitations table
export const corporateInvitations = pgTable("corporate_invitations", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull(),
  email: varchar("email").notNull(),
  invitedBy: varchar("invited_by").notNull(), // User ID
  invitationToken: varchar("invitation_token").notNull().unique(),
  role: varchar("role").default("member"),
  status: varchar("status").default("pending"), // pending, accepted, expired, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#8B1538"), // hex color
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  excerpt: text("excerpt"),
  bulletPoint1: text("bullet_point_1"),
  bulletPoint2: text("bullet_point_2"),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  imageCaption: text("image_caption"),
  featureImageUrl: varchar("feature_image_url"), // separate feature image for category pages
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name"), // for display
  categoryId: integer("category_id").notNull(), // keeping single category for now to prevent breaking changes
  categories: varchar("categories"), // Multiple categories comma-separated
  sector: varchar("sector"), // Multiple sectors comma-separated
  industry: varchar("industry"), // Multiple industries comma-separated  
  articleType: varchar("article_type"), // General, Deals, People/Hiring, Earnings, Strategies/Outlooks, Fundraising
  dealSize: varchar("deal_size"), // £0-50m, £50-500m, £500m+
  isPremium: boolean("is_premium").default(false),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  isRanking: boolean("is_ranking").default(false),
  showOnHomeTop: boolean("show_on_home_top").default(false),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"), // for scheduled publishing
  readTime: integer("read_time"), // in minutes
  views: integer("views").default(0),
  companies: jsonb("companies"), // array of company names
  tags: jsonb("tags"), // array of tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articleViews = pgTable("article_views", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  articleId: integer("article_id").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  isSubscribed: boolean("is_subscribed").default(true),
  preferences: jsonb("preferences"), // frequency, categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table for tracking purchases
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  userEmail: varchar("user_email").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  type: varchar("type").notNull(), // subscription, article_purchase, corporate
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("gbp"),
  status: varchar("status").notNull(), // pending, completed, failed, refunded
  description: text("description"),
  subscriptionTier: varchar("subscription_tier"), // monthly, annual, corporate_basic, etc.
  articleId: integer("article_id"), // for individual article purchases
  corporateId: integer("corporate_id"), // for corporate orders
  metadata: jsonb("metadata"), // additional order details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photo library table for storing and managing uploaded images
export const photoLibrary = pgTable("photo_library", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  url: varchar("url").notNull(),
  title: varchar("title"), // title for the photo
  caption: text("caption"),
  alt: varchar("alt"),
  companies: jsonb("companies").default('[]'), // array of company names for categorization
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type"), // image/jpeg, image/png, etc.
  dimensions: jsonb("dimensions"), // { width: number, height: number }
  uploadedBy: varchar("uploaded_by"), // admin user who uploaded
  tags: jsonb("tags"), // array of tags for categorization
  usageCount: integer("usage_count").default(0), // how many times used in articles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual article purchases tracking
export const purchasedArticles = pgTable("purchased_articles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  articleId: integer("article_id").notNull(),
  orderId: integer("order_id"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Student verification codes
export const studentVerifications = pgTable("student_verifications", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Podcast episodes
export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  audioUrl: varchar("audio_url", { length: 500 }).notNull(),
  duration: varchar("duration", { length: 20 }), // Format: "45:30"
  imageUrl: varchar("image_url", { length: 500 }),
  episodeNumber: integer("episode_number"),
  season: integer("season").default(1),
  publishedAt: timestamp("published_at").defaultNow(),
  isPublished: boolean("is_published").default(true),
  transcript: text("transcript"),
  tags: jsonb("tags"), // Array of tags
  authorId: varchar("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Firms data for deal overview sections
export const firmsData = pgTable("firms_data", {
  id: serial("id").primaryKey(),
  firmName: varchar("firm_name", { length: 255 }).notNull().unique(),
  
  // Company Profile Data (displayed on individual firm pages)
  logoUrl: varchar("logo_url", { length: 500 }),
  companySummary: text("company_summary"),
  website: varchar("website", { length: 255 }),
  founded: varchar("founded", { length: 50 }),
  employees: varchar("employees", { length: 50 }),
  aum: varchar("aum", { length: 50 }), // Assets under management
  firmType: varchar("firm_type", { length: 100 }).default("Service Provider"), // Service Provider, Fund, Investment Bank, etc.
  
  // All Firms Page Data
  headquarters: varchar("headquarters", { length: 100 }).default("New York"),
  ceo: varchar("ceo", { length: 100 }).default("John Smith"),
  totalDeals: integer("total_deals").default(0),
  totalValue: varchar("total_value", { length: 50 }).default("£0.00 B"),
  avgDealSize: varchar("avg_deal_size", { length: 50 }).default("£0.00 B"),
  
  // Deal Overview Metrics (4 customizable boxes)
  metric1Label: varchar("metric1_label", { length: 100 }).default("Total Deal Value (2024)"),
  metric1Value: varchar("metric1_value", { length: 50 }).default("$127.5B"),
  metric2Label: varchar("metric2_label", { length: 100 }).default("Deals Completed"),
  metric2Value: varchar("metric2_value", { length: 50 }).default("342"),
  metric3Label: varchar("metric3_label", { length: 100 }).default("M&A Ranking"),
  metric3Value: varchar("metric3_value", { length: 50 }).default("#1"),
  metric4Label: varchar("metric4_label", { length: 100 }).default("Deal Success Rate"),
  metric4Value: varchar("metric4_value", { length: 50 }).default("94%"),
  
  // Completed Deal
  completedDealTitle: varchar("completed_deal_title", { length: 255 }).default("Tech Acquisition"),
  completedDealDescription: text("completed_deal_description").default("Advisory on $3.2B acquisition in technology sector"),
  completedDealDate: varchar("completed_deal_date", { length: 50 }).default("Q4 2024"),
  
  // In Progress Deal
  inProgressDealTitle: varchar("in_progress_deal_title", { length: 255 }).default("Energy Merger"),
  inProgressDealDescription: text("in_progress_deal_description").default("Lead advisor on $1.8B energy sector merger"),
  inProgressDealDate: varchar("in_progress_deal_date", { length: 50 }).default("Expected Q1 2025"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Article Purchases table for express checkout
export const articlePurchases = pgTable("article_purchases", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerFirstName: varchar("customer_first_name", { length: 100 }).notNull(),
  customerLastName: varchar("customer_last_name", { length: 100 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // £2.99
  currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, completed, failed
  pdfGenerated: boolean("pdf_generated").default(false),
  emailSent: boolean("email_sent").default(false),
  pdfPath: varchar("pdf_path", { length: 500 }),
  purchaseData: jsonb("purchase_data"), // Store additional purchase info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  articles: many(articles),
  savedArticles: many(savedArticles),
  articleViews: many(articleViews),
  podcasts: many(podcasts),
  corporateAccount: one(corporateAccounts, {
    fields: [users.corporateId],
    references: [corporateAccounts.id],
  }),
  corporateUsers: many(corporateUsers),
}));

export const corporateAccountsRelations = relations(corporateAccounts, ({ many }) => ({
  users: many(users),
  corporateUsers: many(corporateUsers),
  invitations: many(corporateInvitations),
}));

export const corporateUsersRelations = relations(corporateUsers, ({ one }) => ({
  corporate: one(corporateAccounts, {
    fields: [corporateUsers.corporateId],
    references: [corporateAccounts.id],
  }),
  user: one(users, {
    fields: [corporateUsers.userId],
    references: [users.id],
  }),
}));

export const corporateInvitationsRelations = relations(corporateInvitations, ({ one }) => ({
  corporate: one(corporateAccounts, {
    fields: [corporateInvitations.corporateId],
    references: [corporateAccounts.id],
  }),
  invitedByUser: one(users, {
    fields: [corporateInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  savedBy: many(savedArticles),
  views: many(articleViews),
}));

export const savedArticlesRelations = relations(savedArticles, ({ one }) => ({
  user: one(users, {
    fields: [savedArticles.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [savedArticles.articleId],
    references: [articles.id],
  }),
}));

export const articleViewsRelations = relations(articleViews, ({ one }) => ({
  user: one(users, {
    fields: [articleViews.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [articleViews.articleId],
    references: [articles.id],
  }),
}));

export const podcastsRelations = relations(podcasts, ({ one }) => ({
  author: one(users, {
    fields: [podcasts.authorId],
    references: [users.id],
  }),
}));

// Notifications table for live updates
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("article"), // article, sector, firm
  sector: varchar("sector"), // investment-banking, private-equity, etc.
  firm: varchar("firm"), // company name if applicable
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [notifications.articleId],
    references: [articles.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertArticleSchema = createInsertSchema(articles)
  .omit({
    id: true,
    views: true,
    createdAt: true,
    updatedAt: true,
    publishedAt: true,
  })
  .extend({
    scheduledAt: z.union([z.date(), z.string(), z.null()]).optional().transform((val) => {
      if (!val) return null;
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
  });

export const insertSavedArticleSchema = createInsertSchema(savedArticles).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Corporate schemas
export const insertCorporateAccountSchema = createInsertSchema(corporateAccounts).omit({
  id: true,
  currentUsers: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCorporateUserSchema = createInsertSchema(corporateUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCorporateInvitationSchema = createInsertSchema(corporateInvitations).omit({
  id: true,
  invitationToken: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPodcastSchema = createInsertSchema(podcasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertStudentVerificationSchema = createInsertSchema(studentVerifications).omit({
  id: true,
  verified: true,
  createdAt: true,
});

export const insertStudentVerificationCodeSchema = createInsertSchema(studentVerificationCodes).omit({
  id: true,
  createdAt: true,
  isUsed: true,
  usedAt: true,
});

export const insertFirmDataSchema = createInsertSchema(firmsData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticlePurchaseSchema = createInsertSchema(articlePurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoLibrarySchema = createInsertSchema(photoLibrary).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type SavedArticle = typeof savedArticles.$inferSelect;
export type InsertSavedArticle = z.infer<typeof insertSavedArticleSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Corporate types
export type CorporateAccount = typeof corporateAccounts.$inferSelect;
export type InsertCorporateAccount = z.infer<typeof insertCorporateAccountSchema>;
export type CorporateUser = typeof corporateUsers.$inferSelect;
export type InsertCorporateUser = z.infer<typeof insertCorporateUserSchema>;
export type CorporateInvitation = typeof corporateInvitations.$inferSelect;
export type InsertCorporateInvitation = z.infer<typeof insertCorporateInvitationSchema>;

// Podcast types
export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type PodcastWithAuthor = Podcast & {
  author: User;
};

// Student verification types
export type StudentVerification = typeof studentVerifications.$inferSelect;
export type InsertStudentVerification = z.infer<typeof insertStudentVerificationSchema>;
export type StudentVerificationCode = typeof studentVerificationCodes.$inferSelect;
export type InsertStudentVerificationCode = z.infer<typeof insertStudentVerificationCodeSchema>;

// Firm data types
export type FirmData = typeof firmsData.$inferSelect;
export type InsertFirmData = z.infer<typeof insertFirmDataSchema>;

// Article purchase types
export type ArticlePurchase = typeof articlePurchases.$inferSelect;
export type InsertArticlePurchase = z.infer<typeof insertArticlePurchaseSchema>;

// Photo library types
export type PhotoLibrary = typeof photoLibrary.$inferSelect;
export type InsertPhotoLibrary = z.infer<typeof insertPhotoLibrarySchema>;

// Email unsubscribe list table
export const emailUnsubscribes = pgTable("email_unsubscribes", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow().notNull(),
  reason: varchar("reason"), // optional reason for unsubscribing
  ipAddress: varchar("ip_address"), // track IP for compliance
});

// Email unsubscribe schemas
export const insertEmailUnsubscribeSchema = createInsertSchema(emailUnsubscribes).omit({
  id: true,
  unsubscribedAt: true,
});

// Email unsubscribe types
export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
export type InsertEmailUnsubscribe = z.infer<typeof insertEmailUnsubscribeSchema>;

// Article with relations
export type ArticleWithDetails = Article & {
  author: User;
  category: Category;
  isSaved?: boolean;
  companies?: string[];
};

// Admin authentication schemas
export const insertAdminAccountSchema = createInsertSchema(adminAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

// Admin authentication types
export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = z.infer<typeof insertAdminAccountSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
