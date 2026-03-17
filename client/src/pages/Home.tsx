import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Upload, Clock, Zap } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: services } = trpc.services.list.useQuery();
  const { data: testimonials } = trpc.testimonials.list.useQuery();
  const featured = services?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* HERO */}
      <section className="border-b-[5px] border-black">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[80vh]">
            <div className="relative flex flex-col justify-center py-16 lg:py-24 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black px-6 lg:px-0 bg-cover bg-center" style={{backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663441668204/NtJgK9LYGJzgEKLSR8pY8f/ChatGPTImage16mar2026,01_55_21_a4b645d7.png')", backgroundPosition: 'center', backgroundSize: 'cover'}}>
              <div className="absolute inset-0 bg-white" style={{opacity: 0.85}}></div>
              <div className="relative z-10">
                <div className="mb-6">
                  <span className="font-mono text-xs tracking-[0.4em] text-gray-500 border-[2px] border-black px-3 py-1">
                    MIXING & MASTERING PROFESSIONALE
                  </span>
                </div>
                <h1 className="font-display text-[clamp(4rem,12vw,9rem)] leading-none text-black mb-8">
                  IL TUO<br />
                  SUONO.<br />
                  <span className="text-stroke">PERFETTO.</span>
                </h1>
              <p className="text-lg md:text-xl text-gray-600 font-medium max-w-md mb-10 leading-relaxed">
                Trasformo le tue tracce grezze in produzioni professionali pronte per la distribuzione. Mixing e mastering di livello mondiale.
              </p>
              <div className="flex flex-col sm:flex-row gap-0">
                <Link href="/services" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal-lg hover-brutal">
                  SCOPRI I SERVIZI <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                {!isAuthenticated && (
                  <a href={getLoginUrl()} className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-display text-sm tracking-widest border-[3px] border-l-0 border-black hover:bg-black hover:text-white transition-colors">
                    ACCEDI ORA
                  </a>
                )}
              </div>
            </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="relative grid grid-cols-2 grid-rows-2">
                {[
                  { num: "500+", label: "PROGETTI\nCOMPLETATI" },
                  { num: "4 GG", label: "CONSEGNA\nSTANDARD" },
                  { num: "100%", label: "CLIENTI\nSODDISFATTI" },
                  { num: "3", label: "REVISIONI\nINCLUSE" },
                ].map((stat, i) => (
                  <div key={i} className={`flex flex-col justify-start items-start p-2 sm:p-4 lg:p-8 ${i % 2 === 0 ? "border-r-[3px]" : ""} ${i < 2 ? "border-b-[3px]" : ""} border-black`}>
                    <div className="font-display text-[1.5rem] sm:text-[2.5rem] lg:text-[5rem] leading-none text-black">{stat.num}</div>
                    <div className="font-mono text-[8px] sm:text-[10px] lg:text-xs tracking-[0.3em] text-gray-500 mt-1 sm:mt-2 whitespace-pre-line">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-b-[3px] border-black bg-black text-white py-4 overflow-hidden">
        <div className="flex gap-16 whitespace-nowrap" style={{animation: "marquee 20s linear infinite"}}>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="font-display text-sm tracking-[0.4em] flex items-center gap-8 shrink-0">
              <span>MIXING</span><span className="text-gray-500">◆</span>
              <span>MASTERING</span><span className="text-gray-500">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* SERVICES PREVIEW */}
      <section className="border-b-[5px] border-black">
        <div className="container py-16 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// 01 SERVIZI</div>
              <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none">COSA<br />OFFRO</h2>
            </div>
            <Link href="/services" className="font-display text-sm tracking-widest border-[3px] border-black px-6 py-3 hover:bg-black hover:text-white transition-colors shadow-brutal hover-brutal">
              TUTTI I PACCHETTI →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[3px] border-black">
              {featured.map((service, idx) => (
                <div key={service.id} className={`p-8 flex flex-col gap-4 ${idx < featured.length - 1 ? "border-b-[3px] md:border-b-0 md:border-r-[3px] border-black" : ""}`}>
                  <div className="font-mono text-xs tracking-[0.3em] text-gray-400">
                    {service.category === "mixing" ? "MIXING" : service.category === "mastering" ? "MASTERING" : "MIXING + MASTERING"}
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl leading-none">{service.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{service.description}</p>
                  <div className="flex items-end justify-between mt-4 pt-4 border-t-[2px] border-black">
                    <div>
                      <div className="font-mono text-xs text-gray-400">DA</div>
                      <div className="font-display text-4xl leading-none">€{service.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-gray-400">CONSEGNA</div>
                      <div className="font-display text-xl">{service.deliveryDays}GG</div>
                    </div>
                  </div>
                  <Link href="/services" className="mt-2 inline-flex items-center gap-2 font-display text-sm tracking-widest border-[2px] border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                    SCOPRI →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-[3px] border-black p-12 text-center">
              <div className="font-display text-2xl text-gray-400">SERVIZI IN ARRIVO</div>
              <p className="font-mono text-sm text-gray-400 mt-2">I pacchetti verranno pubblicati a breve</p>
            </div>
          )}
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-b-[5px] border-black bg-black text-white">
        <div className="container py-16 md:py-20">
          <div className="mb-12">
            <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// 02 PROCESSO</div>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none text-white">COME<br />FUNZIONA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-[3px] border-white">
            {[
              { icon: <Upload size={32} strokeWidth={1.5} />, num: "01", title: "SCEGLI", desc: "Seleziona il pacchetto adatto alle tue esigenze e aggiungilo al carrello." },
              { icon: <Zap size={32} strokeWidth={1.5} />, num: "02", title: "PAGA", desc: "Checkout sicuro con Stripe. Accettiamo tutte le carte di credito." },
              { icon: <Upload size={32} strokeWidth={1.5} />, num: "03", title: "CARICA", desc: "Carica i tuoi file audio (WAV, MP3, FLAC) e lascia le tue note vocali." },
              { icon: <Clock size={32} strokeWidth={1.5} />, num: "04", title: "RICEVI", desc: "Ricevi il tuo mix/master professionale entro i tempi concordati." },
            ].map((step, idx) => (
              <div key={idx} className={`p-8 flex flex-col gap-4 ${idx < 3 ? "border-b-[3px] md:border-b-0 md:border-r-[3px] border-white" : ""}`}>
                <div className="text-gray-400">{step.icon}</div>
                <div className="font-mono text-xs tracking-[0.4em] text-gray-500">{step.num}</div>
                <h3 className="font-display text-3xl text-white leading-none">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials && testimonials.length > 0 && (
        <section className="border-b-[5px] border-black">
          <div className="container py-16 md:py-20">
            <div className="mb-12">
              <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// 03 CLIENTI</div>
              <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none">COSA<br />DICONO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px] border-black">
              {testimonials.slice(0, 3).map((t, idx) => (
                <div key={t.id} className={`p-8 flex flex-col gap-4 ${idx < 2 ? "border-b-[3px] md:border-b-0 md:border-r-[3px] border-black" : ""}`}>
                  <div className="flex gap-1">{Array(t.rating).fill(null).map((_, i) => <span key={i} className="font-display text-lg">★</span>)}</div>
                  <p className="text-base text-gray-700 leading-relaxed flex-1 italic">"{t.content}"</p>
                  <div className="pt-4 border-t-[2px] border-black">
                    <div className="font-display text-lg leading-none">{t.clientName}</div>
                    {t.clientRole && <div className="font-mono text-xs text-gray-400 mt-1">{t.clientRole}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fiverr Trust Section */}
      <section className="border-b-[5px] border-black bg-gray-50">
        <div className="container py-16 md:py-20">
          <div className="border-[3px] border-black p-12 md:p-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// VERIFICA FIVERR</div>
                <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-none mb-4">
                  VEDI TUTTE<br />LE RECENSIONI
                </h2>
                <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                  Con più di 500 progetti completati e una valutazione di 4.9/5 stelle su Fiverr, puoi verificare direttamente la qualità del mio lavoro e le testimonianze autentiche dei miei clienti.
                </p>
              </div>
              <a
                href="https://www.fiverr.com/lilspazio/mix-and-master-your-song-to-perfection"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white font-display text-base tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal-xl hover-brutal shrink-0 whitespace-nowrap"
              >
                VAI A FIVERR →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b-[5px] border-black">
        <div className="container py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-6">// INIZIA ORA</div>
            <h2 className="font-display text-[clamp(3.5rem,9vw,8rem)] leading-none mb-8">
              PRONTO A<br /><span className="text-stroke">SUONARE</span><br />MEGLIO?
            </h2>
            <Link href="/services" className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white font-display text-base tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal-xl hover-brutal">
              INIZIA SUBITO <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
