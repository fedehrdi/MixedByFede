import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Trash2, ShoppingCart, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function Cart() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.get.invalidate(); toast.success("Rimosso dal carrello"); },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const createCheckout = trpc.orders.createCheckout.useMutation({
    onSuccess: (data) => {
      setIsCheckingOut(false);
      if (data.checkoutUrl) {
        toast.info("Reindirizzamento al pagamento...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (e) => { setIsCheckingOut(false); toast.error("Errore checkout", { description: e.message }); },
  });

  const handleCheckout = () => {
    setIsCheckingOut(true);
    createCheckout.mutate({ notes });
  };

  const total = cart?.reduce((sum, item) => sum + (item.service?.price ?? 0) * item.quantity, 0) ?? 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 border-b-[3px] border-black">
          <div className="font-display text-6xl text-gray-200 mb-6">CARRELLO</div>
          <p className="font-mono text-sm text-gray-500 mb-8">Accedi per visualizzare il tuo carrello</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal">
            ACCEDI ORA <ArrowRight size={18} />
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black">
        <div className="container py-12 md:py-16">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// CARRELLO</div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-none">
            IL TUO<br />CARRELLO
          </h1>
        </div>
      </section>

      <div className="container py-12">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
          </div>
        ) : !cart || cart.length === 0 ? (
          <div className="py-20 text-center border-[3px] border-black">
            <ShoppingCart size={64} strokeWidth={1} className="mx-auto text-gray-200 mb-6" />
            <div className="font-display text-4xl text-gray-300 mb-4">CARRELLO VUOTO</div>
            <p className="font-mono text-sm text-gray-400 mb-8">Non hai ancora aggiunto nessun servizio</p>
            <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal">
              SCOPRI I SERVIZI <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-[3px] border-black">
            {/* Items list */}
            <div className="lg:col-span-2 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black">
              <div className="border-b-[3px] border-black px-6 py-4">
                <div className="font-display text-sm tracking-widest">{cart.length} {cart.length === 1 ? "SERVIZIO" : "SERVIZI"}</div>
              </div>
              {cart.map((item, idx) => (
                <div key={item.id} className={`flex items-start gap-4 p-6 ${idx < cart.length - 1 ? "border-b-[3px] border-black" : ""}`}>
                  <div className="flex-1">
                    <div className="font-mono text-xs tracking-[0.3em] text-gray-400 mb-1">
                      {item.service?.category === "mixing" ? "MIXING" : item.service?.category === "mastering" ? "MASTERING" : "MIXING + MASTERING"}
                    </div>
                    <div className="font-display text-2xl leading-none mb-2">{item.service?.name}</div>
                    <div className="flex items-center gap-4 font-mono text-xs text-gray-500">
                      <span>⏱ {item.service?.deliveryDays} giorni</span>
                      <span>↩ {item.service?.revisions} revisioni</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-display text-3xl leading-none">€{item.service?.price}</div>
                    <button
                      onClick={() => removeItem.mutate({ cartItemId: item.id })}
                      disabled={removeItem.isPending}
                      className="p-2 border-[2px] border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex flex-col">
              <div className="border-b-[3px] border-black px-6 py-4">
                <div className="font-display text-sm tracking-widest">RIEPILOGO ORDINE</div>
              </div>

              <div className="p-6 border-b-[3px] border-black flex-1">
                {/* Notes */}
                <div className="mb-6">
                  <label className="font-mono text-xs tracking-[0.3em] text-gray-400 block mb-2">NOTE AGGIUNTIVE</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Istruzioni speciali per il tuo ordine..."
                    rows={4}
                    className="w-full border-[2px] border-black p-3 font-mono text-sm resize-none focus:outline-none focus:border-black"
                  />
                </div>

                {/* Totals */}
                <div className="flex flex-col gap-2 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between font-mono text-sm">
                      <span className="text-gray-600 truncate pr-2">{item.service?.name}</span>
                      <span>€{item.service?.price}</span>
                    </div>
                  ))}
                  <div className="border-t-[2px] border-black pt-3 mt-2 flex justify-between">
                    <div>
                      <div className="font-mono text-xs text-gray-400">TOTALE</div>
                      <div className="font-display text-5xl leading-none">€{total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout button */}
              <div className="p-6">
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || createCheckout.isPending}
                  className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-gray-900 transition-colors shadow-brutal hover-brutal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <>PREPARAZIONE CHECKOUT...</>
                  ) : (
                    <><Lock size={16} strokeWidth={2.5} /> PROCEDI AL PAGAMENTO</>
                  )}
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-gray-400">
                  <Lock size={10} /> Pagamento sicuro con Stripe
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
