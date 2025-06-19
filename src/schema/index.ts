import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 100 }),
  isAdmin: boolean('is_admin').default(false),
  isActive: boolean('is_active').default(true),
  googleId: varchar('google_id', { length: 100 }),
  linkedinId: varchar('linkedin_id', { length: 100 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionType: varchar('subscription_type', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }),
  preferences: jsonb('preferences'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
});

// Articles table
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  imageCaption: varchar('image_caption', { length: 255 }),
  featureImageUrl: varchar('feature_image_url', { length: 500 }),
  authorId: integer('author_id').references(() => users.id),
  authorName: varchar('author_name', { length: 255 }),
  categoryId: integer('category_id').references(() => categories.id),
  isPremium: boolean('is_premium').default(false),
  isPublished: boolean('is_published').default(false),
  isFeatured: boolean('is_featured').default(false),
  isSpotlight: boolean('is_spotlight').default(false),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  readingTime: integer('reading_time').default(5),
  tags: text('tags'),
  metaDescription: varchar('meta_description', { length: 160 }),
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Firms table
export const firms = pgTable('firms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  sector: varchar('sector', { length: 100 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 255 }),
  employeeCount: varchar('employee_count', { length: 50 }),
  founded: varchar('founded', { length: 4 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// User subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('newsletter'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Contact messages table
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  subscriptions: many(subscriptions)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles)
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id]
  })
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  views: true,
  likes: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true, 
  createdAt: true 
});

export const insertFirmSchema = createInsertSchema(firms).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ 
  id: true, 
  createdAt: true,
  isRead: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Firm = typeof firms.$inferSelect;
export type InsertFirm = z.infer<typeof insertFirmSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;