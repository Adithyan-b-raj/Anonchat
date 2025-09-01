import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(500),
  username: z.string(),
  timestamp: z.date(),
  type: z.enum(['message', 'system']).default('message')
});

export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true });

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  isActive: z.boolean().default(true),
  joinedAt: z.date()
});

export const insertUserSchema = userSchema.omit({ id: true, joinedAt: true });

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
