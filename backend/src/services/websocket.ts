import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

interface Client extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client[]> = new Map();

  initialize(server: http.Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as Client;
      client.isAlive = true;

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      client.on('close', () => {
        this.removeClient(client);
      });

      // Send connection confirmation
      client.send(JSON.stringify({ type: 'connected' }));
    });

    // Heartbeat to detect dead connections
    setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws) => {
        const client = ws as Client;
        if (!client.isAlive) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    console.log('WebSocket server initialized');
  }

  private handleMessage(client: Client, message: any) {
    switch (message.type) {
      case 'auth':
        client.userId = message.userId;
        if (message.userId) {
          if (!this.clients.has(message.userId)) {
            this.clients.set(message.userId, []);
          }
          this.clients.get(message.userId)?.push(client);
        }
        break;
      case 'subscribe':
        // Subscribe to specific events (e.g., booking updates)
        break;
    }
  }

  private removeClient(client: Client) {
    if (client.userId) {
      const userClients = this.clients.get(client.userId) || [];
      const index = userClients.indexOf(client);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(client.userId);
      }
    }
  }

  broadcast(event: string, data: any, userId?: string) {
    const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });

    if (userId && this.clients.has(userId)) {
      // Send to specific user
      this.clients.get(userId)?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } else if (this.wss) {
      // Broadcast to all
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  notifyBookingUpdate(bookingId: string, userId: string, status: string) {
    this.broadcast('booking:update', { bookingId, status }, userId);
  }

  notifyScheduleUpdate(serviceId: string) {
    this.broadcast('schedule:update', { serviceId });
  }
}

export const websocketService = new WebSocketService();
