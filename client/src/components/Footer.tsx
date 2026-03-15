import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t-[5px] border-black bg-black text-white mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[3px] border-white">
          {/* Brand */}
          <div className="p-8 border-b-[3px] md:border-b-0 md:border-r-[3px] border-white">
            <div className="font-display text-4xl md:text-5xl text-white mb-4 leading-none">
              [MIXED<br />BY<br />FEDE]
            </div>
            <p className="text-sm text-gray-400 font-mono leading-relaxed">
              Mixing & Mastering<br />
              Professionale.<br />
              Dal suono grezzo<br />
              al prodotto finale.
            </p>
          </div>

          {/* Links */}
          <div className="p-8 border-b-[3px] md:border-b-0 md:border-r-[3px] border-white">
            <div className="font-display text-xs tracking-[0.3em] text-gray-400 mb-6">NAVIGAZIONE</div>
            <div className="flex flex-col gap-3">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Servizi" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/cart", label: "Carrello" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-display text-sm tracking-widest text-white hover:text-gray-300 transition-colors underline-brutal"
                >
                  → {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="p-8">
            <div className="font-display text-xs tracking-[0.3em] text-gray-400 mb-6">CONTATTI</div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-display text-xs tracking-widest text-gray-400 mb-1">EMAIL</div>
                <a href="mailto:info@mixedbyfede.com" className="font-mono text-sm text-white hover:text-gray-300 transition-colors">
                  info@mixedbyfede.com
                </a>
              </div>
              <div>
                <div className="font-display text-xs tracking-widest text-gray-400 mb-1">RISPOSTA</div>
                <p className="font-mono text-sm text-gray-300">Entro 24 ore</p>
              </div>
              <div className="mt-4 pt-4 border-t-[2px] border-white">
                <div className="font-display text-xs tracking-widest text-gray-400 mb-2">FORMATI ACCETTATI</div>
                <div className="flex gap-2 flex-wrap">
                  {["WAV", "MP3", "FLAC"].map((f) => (
                    <span key={f} className="font-mono text-xs px-2 py-1 border-[2px] border-white text-white">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-0 border-[3px] border-t-0 border-white px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <span className="font-mono text-xs text-gray-400">
            © {new Date().getFullYear()} MIXEDBYFEDE. TUTTI I DIRITTI RISERVATI.
          </span>
          <span className="font-mono text-xs text-gray-600">
            MIXING · MASTERING · PRODUZIONE
          </span>
        </div>
      </div>
    </footer>
  );
}
