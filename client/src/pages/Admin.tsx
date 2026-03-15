import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Music, Star, ChevronDown, ChevronUp, Upload, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const ORDER_STATUSES = [
  { value: "pending_payment", label: "In attesa pagamento" },
  { value: "paid", label: "Pagato" },
  { value: "in_progress", label: "In lavorazione" },
  { value: "revision", label: "Revisione" },
  { value: "delivered", label: "Consegnato" },
  { value: "completed", label: "Completato" },
  { value: "cancelled", label: "Annullato" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-600",
  paid: "bg-black text-white",
  in_progress: "bg-black text-white",
  revision: "bg-gray-700 text-white",
  delivered: "bg-black text-white",
  completed: "bg-black text-white",
  cancelled: "bg-gray-200 text-gray-400",
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"orders" | "portfolio" | "testimonials">("orders");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<number, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [isUploadingFinal, setIsUploadingFinal] = useState<number | null>(null);

  // Queries
  const { data: orders, isLoading: loadingOrders } = trpc.admin.allOrders.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: portfolioItems, isLoading: loadingPortfolio } = trpc.portfolio.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: testimonialItems, isLoading: loadingTestimonials } = trpc.testimonials.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  // Mutations
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { utils.admin.allOrders.invalidate(); toast.success("Stato aggiornato"); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const uploadFinal = trpc.admin.uploadFinalFile.useMutation({
    onSuccess: () => { utils.admin.allOrders.invalidate(); toast.success("File finale caricato"); setIsUploadingFinal(null); },
    onError: (e) => { toast.error("Errore upload", { description: e.message }); setIsUploadingFinal(null); },
  });

  const deletePortfolio = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.adminList.invalidate(); toast.success("Eliminato"); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const togglePortfolioPublish = trpc.portfolio.update.useMutation({
    onSuccess: () => { utils.portfolio.adminList.invalidate(); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const deleteTestimonial = trpc.testimonials.delete.useMutation({
    onSuccess: () => { utils.testimonials.adminList.invalidate(); toast.success("Eliminato"); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const toggleTestimonialPublish = trpc.testimonials.update.useMutation({
    onSuccess: () => { utils.testimonials.adminList.invalidate(); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const handleFinalFileUpload = async (orderId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFinal(orderId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId.toString());
      const res = await fetch("/api/upload-audio", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload fallito");
      const { key, url } = await res.json();
      await uploadFinal.mutateAsync({ orderId, fileName: file.name, fileKey: key, fileUrl: url, fileSize: file.size });
    } catch (err) {
      toast.error("Errore upload", { description: err instanceof Error ? err.message : "Riprova" });
      setIsUploadingFinal(null);
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="font-display text-6xl text-gray-200 mb-4">ACCESSO NEGATO</div>
          <p className="font-mono text-sm text-gray-500 mb-6">Questa sezione è riservata agli amministratori</p>
          <Link href="/" className="font-display text-sm tracking-widest border-[2px] border-black px-6 py-3 hover:bg-black hover:text-white transition-colors">
            ← TORNA ALLA HOME
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: "orders" as const, label: "ORDINI", icon: <Package size={16} />, count: orders?.length },
    { id: "portfolio" as const, label: "PORTFOLIO", icon: <Music size={16} />, count: portfolioItems?.length },
    { id: "testimonials" as const, label: "RECENSIONI", icon: <Star size={16} />, count: testimonialItems?.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black bg-black text-white">
        <div className="container py-12">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// AREA AMMINISTRATORE</div>
          <h1 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none text-white">ADMIN<br />PANEL</h1>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b-[3px] border-black">
        <div className="container">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-display text-sm tracking-widest border-r-[2px] border-black transition-colors ${activeTab === tab.id ? "bg-black text-white" : "hover:bg-gray-100"}`}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && (
                  <span className={`font-mono text-xs px-2 py-0.5 border-[1px] ${activeTab === tab.id ? "border-white text-white" : "border-black text-black"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            {loadingOrders ? (
              <div className="py-20 text-center font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
            ) : !orders || orders.length === 0 ? (
              <div className="py-20 text-center border-[3px] border-black">
                <div className="font-display text-3xl text-gray-300">NESSUN ORDINE</div>
              </div>
            ) : (
              <div className="border-[3px] border-black">
                {orders.map((order, idx) => (
                  <div key={order.id} className={idx < orders.length - 1 ? "border-b-[3px] border-black" : ""}>
                    {/* Order row */}
                    <div
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-xs text-gray-400">#{order.id.toString().padStart(4, "0")}</div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 font-mono text-xs tracking-widest ${STATUS_COLORS[order.status] ?? "bg-gray-100"}`}>
                          {ORDER_STATUSES.find((s) => s.value === order.status)?.label ?? order.status}
                        </span>
                        <div className="font-mono text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("it-IT")}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-display text-2xl">€{Number(order.totalAmount).toFixed(2)}</div>
                        {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Expanded order detail */}
                    {expandedOrder === order.id && (
                      <div className="border-t-[3px] border-black bg-gray-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Status update */}
                          <div>
                            <div className="font-mono text-xs tracking-widest text-gray-400 mb-3">AGGIORNA STATO</div>
                            <div className="flex flex-col gap-2">
                              <select
                                value={statusUpdates[order.id] ?? order.status}
                                onChange={(e) => setStatusUpdates((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                className="border-[2px] border-black p-3 font-mono text-sm bg-white focus:outline-none"
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              <textarea
                                placeholder="Note per il cliente..."
                                value={adminNotes[order.id] ?? order.adminNotes ?? ""}
                                onChange={(e) => setAdminNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                rows={3}
                                className="border-[2px] border-black p-3 font-mono text-sm resize-none focus:outline-none"
                              />
                              <button
                                onClick={() => updateStatus.mutate({ orderId: order.id, status: (statusUpdates[order.id] ?? order.status) as "pending_payment" | "paid" | "in_progress" | "revision" | "delivered" | "completed" | "cancelled", adminNotes: adminNotes[order.id] })}
                                disabled={updateStatus.isPending}
                                className="flex items-center gap-2 px-4 py-3 bg-black text-white font-display text-sm tracking-widest border-[2px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                              >
                                <Check size={16} /> SALVA STATO
                              </button>
                            </div>
                          </div>

                          {/* Upload final file */}
                          <div>
                            <div className="font-mono text-xs tracking-widest text-gray-400 mb-3">CARICA FILE FINALE</div>
                            <label className={`flex flex-col items-center gap-3 border-[2px] border-dashed border-black p-6 cursor-pointer hover:bg-white transition-colors ${isUploadingFinal === order.id ? "opacity-50 pointer-events-none" : ""}`}>
                              <Upload size={32} strokeWidth={1.5} className="text-gray-400" />
                              <div className="font-display text-sm text-center">
                                {isUploadingFinal === order.id ? "CARICAMENTO..." : "CARICA FILE FINALE"}
                              </div>
                              <div className="font-mono text-xs text-gray-400">WAV, MP3, FLAC</div>
                              <input type="file" className="hidden" accept=".wav,.mp3,.flac,audio/*" onChange={(e) => handleFinalFileUpload(order.id, e)} disabled={isUploadingFinal === order.id} />
                            </label>
                          </div>
                        </div>

                        {/* Order notes */}
                        {order.notes && (
                          <div className="mt-4 pt-4 border-t-[2px] border-black">
                            <div className="font-mono text-xs text-gray-400 mb-1">NOTE DEL CLIENTE</div>
                            <p className="font-mono text-sm text-gray-600">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="font-display text-sm tracking-widest">GESTIONE PORTFOLIO</div>
              <button
                onClick={() => toast.info("Usa il pannello Database per aggiungere portfolio items")}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white font-display text-xs tracking-widest border-[2px] border-black hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} /> AGGIUNGI
              </button>
            </div>

            {loadingPortfolio ? (
              <div className="py-20 text-center font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
            ) : !portfolioItems || portfolioItems.length === 0 ? (
              <div className="py-20 text-center border-[3px] border-black">
                <div className="font-display text-3xl text-gray-300 mb-4">NESSUN PORTFOLIO ITEM</div>
                <p className="font-mono text-sm text-gray-400">Aggiungi i tuoi lavori tramite il pannello Database</p>
              </div>
            ) : (
              <div className="border-[3px] border-black">
                {portfolioItems.map((item, idx) => (
                  <div key={item.id} className={`flex items-center justify-between p-4 ${idx < portfolioItems.length - 1 ? "border-b-[3px] border-black" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 border-[2px] border-black ${item.isPublished ? "bg-black" : "bg-white"}`} />
                      <div>
                        <div className="font-display text-lg leading-none">{item.title}</div>
                        <div className="font-mono text-xs text-gray-400">{item.artist} · {item.serviceType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePortfolioPublish.mutate({ id: item.id, data: { isPublished: !item.isPublished } })}
                        className={`px-3 py-1 font-mono text-xs border-[2px] border-black transition-colors ${item.isPublished ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}
                      >
                        {item.isPublished ? "PUBBL." : "BOZZA"}
                      </button>
                      <button
                        onClick={() => { if (confirm("Eliminare?")) deletePortfolio.mutate({ id: item.id }); }}
                        className="p-2 border-[2px] border-black hover:bg-black hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {activeTab === "testimonials" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="font-display text-sm tracking-widest">GESTIONE RECENSIONI</div>
              <button
                onClick={() => toast.info("Usa il pannello Database per aggiungere recensioni")}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white font-display text-xs tracking-widest border-[2px] border-black hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} /> AGGIUNGI
              </button>
            </div>

            {loadingTestimonials ? (
              <div className="py-20 text-center font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
            ) : !testimonialItems || testimonialItems.length === 0 ? (
              <div className="py-20 text-center border-[3px] border-black">
                <div className="font-display text-3xl text-gray-300 mb-4">NESSUNA RECENSIONE</div>
                <p className="font-mono text-sm text-gray-400">Aggiungi le recensioni tramite il pannello Database</p>
              </div>
            ) : (
              <div className="border-[3px] border-black">
                {testimonialItems.map((item, idx) => (
                  <div key={item.id} className={`flex items-start justify-between gap-4 p-4 ${idx < testimonialItems.length - 1 ? "border-b-[3px] border-black" : ""}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 border-[2px] border-black mt-1 shrink-0 ${item.isPublished ? "bg-black" : "bg-white"}`} />
                      <div>
                        <div className="font-display text-lg leading-none">{item.clientName}</div>
                        <div className="font-mono text-xs text-gray-400 mb-2">{item.clientRole ?? "Cliente"} · {"★".repeat(item.rating)}</div>
                        <p className="font-mono text-xs text-gray-600 line-clamp-2">"{item.content}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleTestimonialPublish.mutate({ id: item.id, data: { isPublished: !item.isPublished } })}
                        className={`px-3 py-1 font-mono text-xs border-[2px] border-black transition-colors ${item.isPublished ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}
                      >
                        {item.isPublished ? "PUBBL." : "BOZZA"}
                      </button>
                      <button
                        onClick={() => { if (confirm("Eliminare?")) deleteTestimonial.mutate({ id: item.id }); }}
                        className="p-2 border-[2px] border-black hover:bg-black hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
