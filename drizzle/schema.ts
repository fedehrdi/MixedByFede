import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services / Packages ────────────────────────────────────────────────────

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  category: mysqlEnum("category", ["mixing", "mastering", "mixing_mastering"]).notNull(),
  description: text("description").notNull(),
  shortDescription: varchar("shortDescription", { length: 512 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: int("deliveryDays").notNull(),
  revisions: int("revisions").default(2).notNull(),
  features: text("features").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "pending_payment",
    "paid",
    "in_progress",
    "revision",
    "delivered",
    "completed",
    "cancelled",
  ]).default("pending_payment").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 256 }),
  notes: text("notes"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  serviceId: int("serviceId").notNull(),
  serviceName: varchar("serviceName", { length: 256 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── File Uploads ─────────────────────────────────────────────────────────────

export const fileUploads = mysqlTable("file_uploads", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 128 }),
  uploadType: mysqlEnum("uploadType", ["client_source", "admin_final"]).default("client_source").notNull(),
  aiAnalysis: text("aiAnalysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;

// ─── Voice Notes ──────────────────────────────────────────────────────────────

export const voiceNotes = mysqlTable("voice_notes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  audioKey: varchar("audioKey", { length: 1024 }).notNull(),
  audioUrl: text("audioUrl").notNull(),
  transcription: text("transcription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceNote = typeof voiceNotes.$inferSelect;
export type InsertVoiceNote = typeof voiceNotes.$inferInsert;

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  artist: varchar("artist", { length: 256 }).notNull(),
  genre: varchar("genre", { length: 128 }),
  serviceType: mysqlEnum("serviceType", ["mixing", "mastering", "mixing_mastering"]).notNull(),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  isPublished: boolean("isPublished").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 256 }).notNull(),
  clientRole: varchar("clientRole", { length: 256 }),
  content: text("content").notNull(),
  rating: int("rating").default(5).notNull(),
  serviceType: mysqlEnum("serviceType", ["mixing", "mastering", "mixing_mastering"]),
  isPublished: boolean("isPublished").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;