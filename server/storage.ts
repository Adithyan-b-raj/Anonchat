import { type Message, type InsertMessage, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getActiveUsers(): Promise<User[]>;
  setUserActive(id: string, isActive: boolean): Promise<void>;
  removeUser(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private messages: Map<string, Message>;
  private users: Map<string, User>;

  constructor() {
    this.messages = new Map();
    this.users = new Map();
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return messages.slice(-limit);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      joinedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  async setUserActive(id: string, isActive: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isActive = isActive;
      this.users.set(id, user);
    }
  }

  async removeUser(id: string): Promise<void> {
    this.users.delete(id);
  }
}

export const storage = new MemStorage();
