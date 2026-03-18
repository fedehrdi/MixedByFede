/**
 * WebSocket client per le notifiche in tempo reale
 */

export interface WebSocketNotification {
  type: string;
  title: string;
  message: string;
  orderId?: number;
  actionUrl?: string;
}

export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: ((notification: WebSocketNotification) => void)[] = [];
  private isManualClose = false;

  /**
   * Connetti al server WebSocket
   */
  connect(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("[WebSocket] Already connected");
        resolve();
        return;
      }

      this.userId = userId;
      this.isManualClose = false;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws?userId=${userId}`;

      console.log(`[WebSocket] Connecting to ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[WebSocket] Connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("[WebSocket] Message received:", data);

            if (data.type === "notification" || data.type === "broadcast") {
              this.notifyListeners(data.data);
            }
          } catch (error) {
            console.error("[WebSocket] Error parsing message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[WebSocket] Disconnected");
          this.ws = null;

          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(
              `[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`
            );
            setTimeout(() => {
              this.connect(userId).catch(console.error);
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        console.error("[WebSocket] Connection error:", error);
        reject(error);
      }
    });
  }

  /**
   * Disconnetti dal server WebSocket
   */
  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = [];
  }

  /**
   * Sottoscrivi alle notifiche
   */
  subscribe(listener: (notification: WebSocketNotification) => void) {
    this.listeners.push(listener);

    // Ritorna una funzione per unsubscribe
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notifica tutti i listener
   */
  private notifyListeners(notification: WebSocketNotification) {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error("[WebSocket] Error in listener:", error);
      }
    });
  }

  /**
   * Invia un messaggio al server (ping/pong)
   */
  send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Not connected, cannot send message");
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocket] Error sending message:", error);
    }
  }

  /**
   * Verifica se è connesso
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Invia un ping per mantenere la connessione viva
   */
  ping() {
    this.send({ type: "ping" });
  }
}

// Singleton instance
let wsInstance: NotificationWebSocket | null = null;

export function getWebSocketInstance(): NotificationWebSocket {
  if (!wsInstance) {
    wsInstance = new NotificationWebSocket();
  }
  return wsInstance;
}
