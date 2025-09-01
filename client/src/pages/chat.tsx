import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Send, Wifi, WifiOff } from "lucide-react";
import type { Message } from "@shared/schema";

interface TypingUser {
  username: string;
  timestamp: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up old typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(user => now - user.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'init':
          setMessages(data.messages || []);
          setUsername(data.username);
          setUserId(data.userId);
          break;
          
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
          
        case 'userCount':
          setOnlineUsers(data.count);
          break;
          
        case 'typing':
          if (data.username !== username) {
            setTypingUsers(prev => {
              const filtered = prev.filter(user => user.username !== data.username);
              if (data.isTyping) {
                return [...filtered, { username: data.username, timestamp: Date.now() }];
              }
              return filtered;
            });
          }
          break;
          
        case 'error':
          console.error('WebSocket error:', data.message);
          break;
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [username]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: messageInput.trim()
    }));

    setMessageInput("");
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      wsRef.current?.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      wsRef.current?.send(JSON.stringify({
        type: 'typing',
        isTyping: false
      }));
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-primary',
      'bg-secondary', 
      'bg-accent',
      'bg-chart-1',
      'bg-chart-2',
      'bg-chart-3',
      'bg-chart-4',
      'bg-chart-5'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getAvatarLetter = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-destructive'}`}></div>
            <h1 className="text-lg font-semibold text-foreground">Anonymous Chat Room</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              {isConnected ? <Users className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span data-testid="online-users">{onlineUsers} online</span>
            </div>
            <div className="text-xs text-muted-foreground" data-testid="current-time">
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" data-testid="message-container">
        {messages.map((message) => (
          <div key={message.id} className="message-animation">
            {message.type === 'system' ? (
              <div className="flex justify-center">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  <span data-testid={`system-message-${message.id}`}>{message.content}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getAvatarColor(message.username)} rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium`}>
                  <span data-testid={`avatar-${message.id}`}>{getAvatarLetter(message.username)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-foreground text-sm" data-testid={`username-${message.id}`}>
                      {message.username}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`timestamp-${message.id}`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground mt-1 break-words" data-testid={`message-content-${message.id}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicators */}
        {typingUsers.map((typingUser) => (
          <div key={typingUser.username} className="flex items-start space-x-3 typing-indicator">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm">
              <span>⋯</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground italic" data-testid={`typing-${typingUser.username}`}>
                <span>{typingUser.username}</span> is typing...
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <footer className="bg-card border-t border-border px-4 py-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type your message..."
              value={messageInput}
              onChange={handleInputChange}
              className="w-full bg-input border border-border text-foreground placeholder-muted-foreground"
              maxLength={500}
              disabled={!isConnected}
              data-testid="message-input"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground md:hidden">
              <span data-testid="char-count">{messageInput.length}</span>/500
            </div>
          </div>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center space-x-2"
            disabled={!messageInput.trim() || !isConnected}
            data-testid="send-button"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>

        {/* Mobile info bar */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground md:hidden">
          <div className="flex items-center space-x-2">
            <span>Connected as:</span>
            <span className="font-medium text-foreground" data-testid="current-username">{username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent' : 'bg-destructive'}`}></div>
            <span data-testid="connection-status">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </footer>

      {/* Connection Status Modal */}
      {!isConnected && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" data-testid="connection-modal">
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4">
            <Card className="bg-card border border-border shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-4 h-4 bg-destructive rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-foreground">Connection Lost</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                We're trying to reconnect you to the chat room. Please wait...
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="retry-connection"
                >
                  Retry Connection
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
