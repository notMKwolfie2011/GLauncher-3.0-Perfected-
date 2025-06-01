import { users, gameFiles, type User, type InsertUser, type GameFile, type InsertGameFile } from "@shared/schema";
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
