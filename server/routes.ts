import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server on /ws path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Generate random anonymous username
  function generateUsername(): string {
    return `Anonymous_${Math.floor(Math.random() * 10000)}`;
  }

  // Broadcast message to all connected clients
  function broadcast(message: any, excludeClient?: ExtendedWebSocket) {
    wss.clients.forEach((client: WebSocket) => {
      const extClient = client as ExtendedWebSocket;
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Send active users count to all clients
  async function broadcastUserCount() {
    const activeUsers = await storage.getActiveUsers();
    broadcast({
      type: 'userCount',
      count: activeUsers.length
    });
  }

  wss.on('connection', async (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection');

    // Generate username and create user
    const username = generateUsername();
    const user = await storage.createUser({ username, isActive: true });
    ws.userId = user.id;
    ws.username = username;

    // Send initial data to new client
    const messages = await storage.getMessages();
    ws.send(JSON.stringify({
      type: 'init',
      messages: messages,
      username: username,
      userId: user.id
    }));

    // Create and broadcast join message
    const joinMessage = await storage.createMessage({
      content: `${username} joined the chat`,
      username: 'System',
      type: 'system'
    });

    broadcast({
      type: 'message',
      message: joinMessage
    });

    // Broadcast updated user count
    await broadcastUserCount();

    ws.on('message', async (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());

        switch (parsed.type) {
          case 'message':
            // Validate message content
            const messageData = insertMessageSchema.parse({
              content: parsed.content,
              username: ws.username,
              type: 'message'
            });

            // Store message
            const message = await storage.createMessage(messageData);

            // Broadcast to all clients
            broadcast({
              type: 'message',
              message: message
            });
            break;

          case 'typing':
            // Broadcast typing indicator to others
            broadcast({
              type: 'typing',
              username: ws.username,
              isTyping: parsed.isTyping
            }, ws);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      
      if (ws.userId && ws.username) {
        // Remove user
        await storage.removeUser(ws.userId);

        // Create and broadcast leave message
        const leaveMessage = await storage.createMessage({
          content: `${ws.username} left the chat`,
          username: 'System',
          type: 'system'
        });

        broadcast({
          type: 'message',
          message: leaveMessage
        });

        // Broadcast updated user count
        await broadcastUserCount();
      }
    });
  });

  // REST API endpoints
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/users/active', async (req, res) => {
    try {
      const users = await storage.getActiveUsers();
      res.json({ count: users.length, users });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active users' });
    }
  });

  return httpServer;
}
