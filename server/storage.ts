import { users, gameFiles, type User, type InsertUser, type GameFile, type InsertGameFile } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllGameFiles(): Promise<GameFile[]>;
  getGameFile(id: number): Promise<GameFile | undefined>;
  createGameFile(file: InsertGameFile): Promise<GameFile>;
  deleteGameFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameFiles: Map<number, GameFile>;
  private currentUserId: number;
  private currentFileId: number;

  constructor() {
    this.users = new Map();
    this.gameFiles = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllGameFiles(): Promise<GameFile[]> {
    return Array.from(this.gameFiles.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getGameFile(id: number): Promise<GameFile | undefined> {
    return this.gameFiles.get(id);
  }

  async createGameFile(insertFile: InsertGameFile): Promise<GameFile> {
    const id = this.currentFileId++;
    const file: GameFile = { 
      ...insertFile, 
      id, 
      uploadedAt: new Date()
    };
    this.gameFiles.set(id, file);
    return file;
  }

  async deleteGameFile(id: number): Promise<boolean> {
    return this.gameFiles.delete(id);
  }
}

export const storage = new MemStorage();
