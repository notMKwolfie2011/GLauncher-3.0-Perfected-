import { users, gameFiles, communityThemes, type User, type InsertUser, type GameFile, type InsertGameFile, type CommunityTheme, type InsertCommunityTheme } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllGameFiles(): Promise<GameFile[]>;
  getGameFile(id: number): Promise<GameFile | undefined>;
  createGameFile(file: InsertGameFile): Promise<GameFile>;
  deleteGameFile(id: number): Promise<boolean>;

  // Community themes
  getAllCommunityThemes(): Promise<CommunityTheme[]>;
  getCommunityTheme(id: number): Promise<CommunityTheme | undefined>;
  createCommunityTheme(theme: InsertCommunityTheme): Promise<CommunityTheme>;
  updateThemeDownloads(id: number): Promise<void>;
  rateTheme(id: number, rating: number): Promise<void>;
  searchThemes(query: string): Promise<CommunityTheme[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllGameFiles(): Promise<GameFile[]> {
    const files = await db
      .select()
      .from(gameFiles)
      .orderBy(desc(gameFiles.uploadedAt));
    return files;
  }

  async getGameFile(id: number): Promise<GameFile | undefined> {
    const [file] = await db.select().from(gameFiles).where(eq(gameFiles.id, id));
    return file || undefined;
  }

  async createGameFile(insertFile: InsertGameFile): Promise<GameFile> {
    const [file] = await db
      .insert(gameFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async deleteGameFile(id: number): Promise<boolean> {
    const result = await db.delete(gameFiles).where(eq(gameFiles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Community themes implementation
  async getAllCommunityThemes(): Promise<CommunityTheme[]> {
    return await db.select().from(communityThemes).where(eq(communityThemes.isPublic, true)).orderBy(desc(communityThemes.downloads));
  }

  async getCommunityTheme(id: number): Promise<CommunityTheme | undefined> {
    const [theme] = await db.select().from(communityThemes).where(eq(communityThemes.id, id));
    return theme || undefined;
  }

  async createCommunityTheme(insertTheme: InsertCommunityTheme): Promise<CommunityTheme> {
    const [theme] = await db.insert(communityThemes).values(insertTheme).returning();
    return theme;
  }

  async updateThemeDownloads(id: number): Promise<void> {
    const [theme] = await db.select().from(communityThemes).where(eq(communityThemes.id, id));
    if (!theme) return;
    
    await db.update(communityThemes)
      .set({ downloads: (theme.downloads || 0) + 1 })
      .where(eq(communityThemes.id, id));
  }

  async rateTheme(id: number, rating: number): Promise<void> {
    const [theme] = await db.select().from(communityThemes).where(eq(communityThemes.id, id));
    if (!theme) return;

    const currentRating = parseFloat(theme.rating || "0");
    const currentCount = theme.ratingCount || 0;
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    await db.update(communityThemes)
      .set({ 
        rating: newRating.toFixed(2),
        ratingCount: newCount 
      })
      .where(eq(communityThemes.id, id));
  }

  async searchThemes(query: string): Promise<CommunityTheme[]> {
    return await db.select()
      .from(communityThemes)
      .where(eq(communityThemes.isPublic, true))
      .orderBy(desc(communityThemes.downloads));
  }
}

export const storage = new DatabaseStorage();
