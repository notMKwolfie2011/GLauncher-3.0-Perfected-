import { pgTable, text, serial, integer, timestamp, varchar, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameFiles = pgTable("game_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  clientVersion: text("client_version"),
  minecraftVersion: text("minecraft_version"),
  clientType: text("client_type"),
  compatibilityWarnings: text("compatibility_warnings").array(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameFileSchema = createInsertSchema(gameFiles).omit({
  id: true,
  uploadedAt: true,
});

// Community themes table
export const communityThemes = pgTable("community_themes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  authorName: varchar("author_name", { length: 50 }).notNull(),
  themeData: jsonb("theme_data").notNull(),
  downloads: integer("downloads").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  tags: varchar("tags", { length: 255 }),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunityThemeSchema = createInsertSchema(communityThemes).omit({
  id: true,
  downloads: true,
  rating: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGameFile = z.infer<typeof insertGameFileSchema>;
export type GameFile = typeof gameFiles.$inferSelect;
export type InsertCommunityTheme = z.infer<typeof insertCommunityThemeSchema>;
export type CommunityTheme = typeof communityThemes.$inferSelect;
