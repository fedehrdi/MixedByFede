import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWebSocketInstance } from "@/lib/websocket";
import type { WebSocketNotification } from "@/lib/websocket";
import { useAuth } from "@/_core/hooks/useAuth";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const ws = getWebSocketInstance();

  // Connetti al WebSocket quando il componente viene montato
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    // Connetti al WebSocket
    ws.connect(user.id).catch(console.error);

    // Sottoscrivi alle notifiche
    const unsubscribe = ws.subscribe((notification: WebSocketNotification) => {
      if (!mounted) return;
      console.log("[NotificationCenter] Notification received:", notification);
      // Invalida le notifiche per ricaricarle
      utils.notifications.unread.invalidate();
      utils.notifications.list.invalidate();
      // Mostra un toast
      toast.success(notification.title, {
        description: notification.message,
      });
    });

    // Invia un ping ogni 30 secondi per mantenere la connessione viva
    const pingInterval = setInterval(() => {
      if (ws.isConnected()) {
        ws.ping();
      }
    }, 30000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(pingInterval);
    };
  }, [user?.id]);

  // Fetch unread notifications
  const { data: unreadNotifications = [] } = trpc.notifications.unread.useQuery();
  const { data: allNotifications = [] } = trpc.notifications.list.useQuery();

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unread.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unread.invalidate();
      utils.notifications.list.invalidate();
      toast.success("Tutte le notifiche segnate come lette");
    },
  });

  const deleteNotificationMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.unread.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate({ id });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return "📦";
      case "order_in_progress":
        return "⚙️";
      case "order_completed":
        return "✅";
      case "order_cancelled":
        return "❌";
      case "contact_received":
        return "💬";
      case "payment_received":
        return "💳";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order_created":
        return "bg-blue-50 border-blue-200";
      case "order_in_progress":
        return "bg-yellow-50 border-yellow-200";
      case "order_completed":
        return "bg-green-50 border-green-200";
      case "order_cancelled":
        return "bg-red-50 border-red-200";
      case "contact_received":
        return "bg-purple-50 border-purple-200";
      case "payment_received":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadNotifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifiche</h3>
            <div className="flex gap-2">
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Segna tutte come lette
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString(
                              "it-IT"
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Segna come letta"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Elimina"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Action URL */}
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                        >
                          Visualizza dettagli →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <a
                href="/dashboard"
                className="text-sm text-blue-600 hover:underline"
              >
                Visualizza tutte le notifiche
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
