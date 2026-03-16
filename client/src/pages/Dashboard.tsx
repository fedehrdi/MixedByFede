import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Package, Clock, CheckCircle, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STATUS_CONFIG = {
  pending_payment: { label: "IN ATTESA PAGAMENTO", icon: <Clock size={14} />, bg: "bg-gray-100", text: "text-gray-600" },
  paid: { label: "PAGATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  in_progress: { label: "IN LAVORAZIONE", icon: <RefreshCw size={14} />, bg: "bg-black", text: "text-white" },
  revision: { label: "REVISIONE", icon: <AlertCircle size={14} />, bg: "bg-gray-800", text: "text-white" },
  delivered: { label: "CONSEGNATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  completed: { label: "COMPLETATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  cancelled: { label: "ANNULLATO", icon: <XCircle size={14} />, bg: "bg-gray-200", text: "text-gray-500" },
} as const;

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="font-display text-6xl text-gray-200 mb-6">DASHBOARD</div>
          <p className="font-mono text-sm text-gray-500 mb-8">Accedi per visualizzare i tuoi ordini</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal">
            ACCEDI ORA <ArrowRight size={18} />
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  const activeOrders = orders?.filter((o) => !["completed", "cancelled"].includes(o.status)) ?? [];
  const completedOrders = orders?.filter((o) => o.status === "completed") ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black">
        <div className="container py-12 md:py-16">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// DASHBOARD</div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none mb-4">
            CIAO,<br />{(user?.name ?? "UTENTE").toUpperCase()}
          </h1>
          <div className="flex gap-0 mt-6">
            <div className="border-[3px] border-black px-6 py-3 border-r-0">
              <div className="font-mono text-xs text-gray-400">ORDINI ATTIVI</div>
              <div className="font-display text-3xl leading-none">{activeOrders.length}</div>
            </div>
            <div className="border-[3px] border-black px-6 py-3 border-r-0">
              <div className="font-mono text-xs text-gray-400">COMPLETATI</div>
              <div className="font-display text-3xl leading-none">{completedOrders.length}</div>
            </div>
            <div className="border-[3px] border-black px-6 py-3">
              <div className="font-mono text-xs text-gray-400">TOTALE ORDINI</div>
              <div className="font-display text-3xl leading-none">{orders?.length ?? 0}</div>
            </div>


            {/* Order Status Timeline */}
            {selectedOrder && (
              <div className="border-[3px] border-black">
                <div className="px-6 py-4 border-b-[3px] border-black bg-black text-white">
                  <div className="font-display text-sm tracking-widest">TRACCIAMENTO ORDINE #{selectedOrder.id}</div>
                </div>
                <div className="p-8">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-black"></div>
                    
                    {/* Timeline steps */}
                    <div className="space-y-8 ml-20">
                      {[
                        { status: "pending_payment", label: "Pagamento in attesa", icon: "💳" },
                        { status: "paid", label: "Pagamento confermato", icon: "✓" },
                        { status: "in_progress", label: "Mixing in corso", icon: "🎚️" },
                        { status: "revision", label: "In revisione", icon: "👂" },
                        { status: "delivered", label: "Pronto per il download", icon: "📥" },
                        { status: "completed", label: "Completato", icon: "🎉" },
                      ].map((step, idx) => {
                        const isCompleted = ["pending_payment", "paid", "in_progress", "revision", "delivered", "completed"].indexOf(selectedOrder.status) >= idx;
                        const isActive = selectedOrder.status === step.status;
                        return (
                          <div key={step.status} className="relative">
                            <div className={`absolute -left-[34px] w-8 h-8 rounded-full border-[3px] flex items-center justify-center text-lg transition-colors ${
                              isActive ? "bg-black text-white border-black" : isCompleted ? "bg-black text-white border-black" : "bg-white border-black"
                            }`}>
                              {step.icon}
                            </div>
                            <div>
                              <div className={`font-display text-sm tracking-widest ${isActive ? "text-black" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                                {step.label}
                              </div>
                              {isActive && <div className="font-mono text-xs text-gray-500 mt-1">STATO ATTUALE</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      <div className="container py-12">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-20 text-center border-[3px] border-black">
            <Package size={64} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
            <div className="font-display text-4xl text-gray-300 mb-4">NESSUN ORDINE</div>
            <p className="font-mono text-sm text-gray-400 mb-8">Non hai ancora effettuato nessun ordine</p>
            <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal">
              SCOPRI I SERVIZI <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <div className="mb-0">
                <div className="border-[3px] border-black border-b-0 px-6 py-4 bg-black text-white">
                  <div className="font-display text-sm tracking-widest">ORDINI IN CORSO</div>
                </div>
                <div className="border-[3px] border-black">
                  {activeOrders.map((order, idx) => {
                    const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div key={order.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 ${idx < activeOrders.length - 1 ? "border-b-[3px] border-black" : ""}`}>
                        <div className="flex items-start gap-4">
                          <div className="font-mono text-xs text-gray-400 pt-1">#{order.id.toString().padStart(4, "0")}</div>
                          <div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-xs tracking-widest mb-2 ${status.bg} ${status.text}`}>
                              {status.icon} {status.label}
                            </div>
                            <div className="font-mono text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="font-display text-3xl leading-none">€{Number(order.totalAmount).toFixed(2)}</div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 font-display text-sm tracking-widest border-[2px] border-black hover:bg-black hover:text-white transition-colors"
                          >
                            DETTAGLI <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed orders */}
            {completedOrders.length > 0 && (
              <div className="mt-8">
                <div className="border-[3px] border-black border-b-0 px-6 py-4">
                  <div className="font-display text-sm tracking-widest text-gray-500">STORICO ORDINI</div>
                </div>
                <div className="border-[3px] border-black">
                  {completedOrders.map((order, idx) => {
                    const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div key={order.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 ${idx < completedOrders.length - 1 ? "border-b-[3px] border-black" : ""}`}>
                        <div className="flex items-start gap-4">
                          <div className="font-mono text-xs text-gray-400 pt-1">#{order.id.toString().padStart(4, "0")}</div>
                          <div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-xs tracking-widest mb-2 ${status.bg} ${status.text}`}>
                              {status.icon} {status.label}
                            </div>
                            <div className="font-mono text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="font-display text-3xl leading-none text-gray-400">€{Number(order.totalAmount).toFixed(2)}</div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 font-display text-sm tracking-widest border-[2px] border-black hover:bg-black hover:text-white transition-colors"
                          >
                            DETTAGLI <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
