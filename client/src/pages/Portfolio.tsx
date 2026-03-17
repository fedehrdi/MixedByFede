import { trpc } from "@/lib/trpc";
import { Music, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const CATEGORY_LABELS = {
  mixing: "MIXING",
  mastering: "MASTERING",
  mixing_mastering: "MIXING + MASTERING",
};

export default function Portfolio() {
  const { data: portfolio, isLoading: loadingPortfolio } = trpc.portfolio.list.useQuery();
  const { data: testimonials, isLoading: loadingTestimonials } = trpc.testimonials.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black">
        <div className="container py-16 md:py-20">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-4">// PORTFOLIO</div>
          <h1 className="font-display text-[clamp(4rem,10vw,9rem)] leading-none mb-6">
            LAVORI<br />
            <span className="text-stroke">RECENTI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
            Una selezione dei progetti su cui ho lavorato. Ogni traccia racconta una storia diversa, ogni mix è unico.
          </p>
        </div>
      </section>




      {/* Spotify Album */}
      <section className="border-b-[5px] border-black">
        <div className="container py-16 md:py-20">
          <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-8">// SPOTIFY</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none mb-6">
                ASCOLTA<br />
                <span className="text-stroke">DIRETTAMENTE</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Uno dei miei ultimi lavori disponibile su Spotify. Ascolta come suonano i miei mix e master professionali.
              </p>
              <a href="https://open.spotify.com/intl-it/album/61P3x1QlAcZ6C2XdhNsWFX?si=FDtrPPd0TVeXZMKzJE0Nhg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-display text-sm tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal hover-brutal">
                APRI SU SPOTIFY →
              </a>
            </div>
            <div className="flex justify-center">
              <iframe src="https://open.spotify.com/embed/album/61P3x1QlAcZ6C2XdhNsWFX?utm_source=generator" width="100%" height="352" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="border-[3px] border-black"></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b-[5px] border-black">
        <div className="container py-16 md:py-20">
          <div className="mb-12">
            <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// RECENSIONI</div>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] leading-none">
              COSA<br />DICONO
            </h2>
          </div>

          {loadingTestimonials ? (
            <div className="py-10 text-center">
              <div className="font-display text-2xl text-gray-300 animate-pulse">CARICAMENTO...</div>
            </div>
          ) : !testimonials || testimonials.length === 0 ? (
            <div className="border-[3px] border-black p-12 text-center">
              <div className="font-display text-3xl text-gray-300 mb-2">NESSUNA RECENSIONE</div>
              <p className="font-mono text-sm text-gray-400">Le recensioni verranno pubblicate a breve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-[3px] border-black">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className={`p-8 flex flex-col gap-4 ${idx % 2 === 0 ? "border-b-[3px] md:border-b-0 md:border-r-[3px]" : "border-b-[3px]"} ${idx >= testimonials.length - 2 ? "last:border-b-0" : ""} border-black`}
                >
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array(5).fill(null).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        strokeWidth={2}
                        className={i < t.rating ? "fill-black text-black" : "text-gray-200"}
                      />
                    ))}
                  </div>

                  {/* Service type badge */}
                  {t.serviceType && (
                    <span className="font-mono text-xs tracking-widest border-[2px] border-black px-2 py-1 w-fit">
                      {CATEGORY_LABELS[t.serviceType as keyof typeof CATEGORY_LABELS]}
                    </span>
                  )}

                  {/* Content */}
                  <p className="text-base text-gray-700 leading-relaxed flex-1 italic">"{t.content}"</p>

                  {/* Author */}
                  <div className="pt-4 border-t-[2px] border-black">
                    <div className="font-display text-xl leading-none">{t.clientName}</div>
                    {t.clientRole && <div className="font-mono text-xs text-gray-400 mt-1">{t.clientRole}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Fiverr Trust Section */}
      <section className="border-t-[5px] border-black bg-gray-50">
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
      <section>
        <div className="container py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-3">// LAVORIAMO INSIEME</div>
              <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none">
                IL TUO PROGETTO<br />È IL PROSSIMO.
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white font-display text-base tracking-widest border-[3px] border-black hover:bg-white hover:text-black transition-colors shadow-brutal-xl hover-brutal shrink-0"
            >
              INIZIA ORA →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
