import { WebSocketServer } from "ws";
import { Server } from "http";
import { parse } from "url";
import { IncomingMessage } from "http";

interface WebSocketClient {
  userId: number;
  ws: any;
}

const clients: Map<number, WebSocketClient[]> = new Map();

/**
 * Inizializza il server WebSocket per le notifiche in tempo reale
 */
export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: any, req: IncomingMessage) => {
    console.log("[WebSocket] New connection attempt");

    // Estrai l'userId dal query string
    const { query } = parse(req.url || "", true);
    const userId = parseInt(query.userId as string);

    if (!userId || isNaN(userId)) {
      console.warn("[WebSocket] Invalid userId, closing connection");
      ws.close(1008, "Invalid userId");
      return;
    }

    console.log(`[WebSocket] User ${userId} connected`);

    // Aggiungi il client alla lista
    if (!clients.has(userId)) {
      clients.set(userId, []);
    }
    clients.get(userId)!.push({ userId, ws });

    // Invia un messaggio di conferma
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connesso alle notifiche in tempo reale",
      })
    );

    // Gestisci i messaggi ricevuti
    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);
        console.log(`[WebSocket] Message from user ${userId}:`, message);

        // Rispondi con un ping/pong per mantenere la connessione viva
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    });

    // Gestisci la chiusura della connessione
    ws.on("close", () => {
      console.log(`[WebSocket] User ${userId} disconnected`);
      const userClients = clients.get(userId);
      if (userClients) {
        const index = userClients.findIndex((c) => c.ws === ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }
    });

    // Gestisci gli errori
    ws.on("error", (error: Error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
    });
  });

  console.log("[WebSocket] Server initialized");
  return wss;
}

/**
 * Invia una notifica in tempo reale a un utente specifico
 */
export function sendNotificationToUser(
  userId: number,
  notification: {
    type: string;
    title: string;
    message: string;
    orderId?: number;
    actionUrl?: string;
  }
) {
  const userClients = clients.get(userId);

  if (!userClients || userClients.length === 0) {
    console.log(`[WebSocket] No connected clients for user ${userId}`);
    return false;
  }

  const message = JSON.stringify({
    type: "notification",
    data: notification,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  userClients.forEach((client) => {
    try {
      if (client.ws.readyState === 1) {
        // WebSocket.OPEN
        client.ws.send(message);
        sentCount++;
      }
    } catch (error) {
      console.error(`[WebSocket] Error sending to user ${userId}:`, error);
    }
  });

  console.log(
    `[WebSocket] Sent notification to user ${userId} (${sentCount} connections)`
  );
  return sentCount > 0;
}

/**
 * Invia una notifica a tutti gli admin
 */
export async function sendNotificationToAdmins(notification: {
  type: string;
  title: string;
  message: string;
  orderId?: number;
  actionUrl?: string;
}) {
  try {
    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    const adminList = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    let sentCount = 0;
    for (const admin of adminList) {
      if (sendNotificationToUser(admin.id, notification)) {
        sentCount++;
      }
    }

    console.log(`[WebSocket] Sent notification to ${sentCount} admins`);
  } catch (error) {
    console.error("[WebSocket] Error sending to admins:", error);
  }
}

/**
 * Broadcast a tutti i client connessi
 */
export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
}) {
  const message = JSON.stringify({
    type: "broadcast",
    data: notification,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      try {
        if (client.ws.readyState === 1) {
          client.ws.send(message);
          sentCount++;
        }
      } catch (error) {
        console.error("[WebSocket] Error broadcasting:", error);
      }
    });
  });

  console.log(`[WebSocket] Broadcast sent to ${sentCount} connections`);
}

/**
 * Ottieni il numero di client connessi per un utente
 */
export function getConnectedClientsCount(userId: number): number {
  return clients.get(userId)?.length ?? 0;
}

/**
 * Ottieni il numero totale di client connessi
 */
export function getTotalConnectedClients(): number {
  let total = 0;
  clients.forEach((userClients) => {
    total += userClients.length;
  });
  return total;
}
