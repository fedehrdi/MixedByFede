import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, ShoppingCart, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Services() {
  const { isAuthenticated } = useAuth();
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const utils = trpc.useUtils();

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("Aggiunto al carrello", {
        description: "Vai al carrello per completare l'acquisto",
        action: { label: "Vai al carrello", onClick: () => window.location.href = "/cart" },
      });
    },
    onError: (e) => toast.error("Errore", { description: e.message }),
  });

  const mixing = services?.filter((s) => s.category === "mixing") ?? [];
  const mastering = services?.filter((s) => s.category === "mastering") ?? [];
  const both = services?.filter((s) => s.category === "mixing_mastering") ?? [];

  const handleAdd = (serviceId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCart.mutate({ serviceId });
  };

  const CategorySection = ({ title, subtitle, items }: { title: string; subtitle: string; items: typeof services }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-0">
        <div className="border-b-[3px] border-black py-8 px-0">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-2">{subtitle}</div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-b-[3px] border-black">
          {items.map((service, idx) => (
            <div
              key={service.id}
              className={`flex flex-col border-b-[3px] md:border-b-0 last:border-b-0 ${
                idx % 3 !== 2 ? "md:border-r-[3px]" : ""
              } border-black`}
            >
              {/* Header */}
              <div className="p-6 border-b-[3px] border-black bg-black text-white">
                <div className="font-mono text-xs tracking-[0.3em] text-gray-400 mb-2">
                  {service.category === "mixing" ? "MIXING" : service.category === "mastering" ? "MASTERING" : "MIXING + MASTERING"}
                </div>
                <h3 className="font-display text-3xl leading-none text-white">{service.name}</h3>
              </div>

              {/* Price */}
              <div className="px-6 py-4 border-b-[3px] border-black flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-gray-400">PREZZO</div>
                  <div className="font-display text-5xl leading-none">€{service.price}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-500 mb-1">
                    <Clock size={12} /> {service.deliveryDays} GIORNI
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
                    <RotateCcw size={12} /> {service.revisions} REVISIONI
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-6 py-4 border-b-[3px] border-black flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              {/* Features */}
              <div className="px-6 py-4 border-b-[3px] border-black">
                <div className="font-mono text-xs tracking-[0.3em] text-gray-400 mb-3">INCLUDE</div>
                <ul className="flex flex-col gap-2">
                  {service.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-6">
                <button
                  onClick={() => handleAdd(service.id)}
                  disabled={addToCart.isPending}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={18} strokeWidth={2.5} />
                  {isAuthenticated ? "AGGIUNGI AL CARRELLO" : "ACCEDI PER ACQUISTARE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black">
        <div className="container py-16 md:py-20">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-4">// CATALOGO SERVIZI</div>
          <h1 className="font-display text-[clamp(4rem,10vw,9rem)] leading-none mb-6">
            SERVIZI &<br />
            <span className="text-stroke">PREZZI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
            Scegli il pacchetto più adatto alle tue esigenze. Ogni servizio include revisioni, comunicazione diretta e consegna nei tempi indicati.
          </p>
        </div>
      </section>

      {/* Services */}
      <div className="container">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
          </div>
        ) : services && services.length > 0 ? (
          <>
            <CategorySection title="MIXING" subtitle="// 01" items={mixing} />
            <CategorySection title="MASTERING" subtitle="// 02" items={mastering} />
            <CategorySection title="MIXING + MASTERING" subtitle="// 03" items={both} />
          </>
        ) : (
          <div className="py-20 text-center border-b-[3px] border-black">
            <div className="font-display text-4xl text-gray-300 mb-4">NESSUN SERVIZIO</div>
            <p className="font-mono text-sm text-gray-400">I servizi verranno pubblicati a breve. Torna presto!</p>
          </div>
        )}
      </div>

      {/* FAQ strip */}
      <section className="border-t-[5px] border-black bg-black text-white">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[3px] border-white">
            {[
              { q: "QUALI FORMATI ACCETTI?", a: "WAV (preferito), MP3 e FLAC. Per il mixing consiglio sempre WAV a 24bit/44.1kHz o superiore." },
              { q: "COME FUNZIONANO LE REVISIONI?", a: "Ogni pacchetto include un numero di revisioni. Puoi lasciare note scritte o vocali per comunicare le modifiche." },
              { q: "COME RICEVO I FILE FINALI?", a: "I file vengono caricati direttamente nella tua dashboard e puoi scaricarli in qualsiasi momento." },
            ].map((faq, idx) => (
              <div key={idx} className={`p-8 ${idx < 2 ? "border-b-[3px] md:border-b-0 md:border-r-[3px] border-white" : ""}`}>
                <h3 className="font-display text-lg text-white mb-3">{faq.q}</h3>
                <p className="font-mono text-xs text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
