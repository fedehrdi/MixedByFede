import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { NotificationCenter } from "./NotificationCenter";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const { data: cart } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cart?.length ?? 0;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Servizi" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/contact", label: "Contatti" },
  ];

  return (
    <nav className="border-b-[3px] border-black bg-white sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="font-display text-2xl md:text-3xl tracking-tight leading-none">
              <span className="text-black">[</span>
              <span className="text-black">MIXED</span>
              <span className="text-black font-display text-2xl md:text-3xl">BY</span>
              <span className="text-black">FEDE</span>
              <span className="text-black">]</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-5 py-2 font-display text-sm tracking-widest border-r-[2px] border-black transition-colors hover:bg-black hover:text-white ${location === link.href ? "bg-black text-white" : "text-black"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0">
            {/* Notifications */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center px-4 py-2 border-l-[2px] border-black h-16 md:h-20">
                <NotificationCenter />
              </div>
            )}

            {/* Cart */}
            {isAuthenticated && (
              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-4 py-2 border-l-[2px] border-black hover:bg-black hover:text-white transition-colors group h-16 md:h-20"
              >
                <ShoppingCart size={20} strokeWidth={2.5} />
                {cartCount > 0 && (
                  <span className="absolute top-3 right-2 bg-black text-white text-xs font-bold w-5 h-5 flex items-center justify-center font-mono">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-0">
                <Link
                  href="/dashboard"
                  className="px-5 py-2 font-display text-sm tracking-widest border-l-[2px] border-black hover:bg-black hover:text-white transition-colors h-16 md:h-20 flex items-center"
                >
                  Dashboard
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-5 py-2 font-display text-sm tracking-widest border-l-[2px] border-black bg-black text-white hover:bg-gray-800 transition-colors h-16 md:h-20 flex items-center"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="px-5 py-2 font-display text-sm tracking-widest border-l-[2px] border-black hover:bg-black hover:text-white transition-colors h-16 md:h-20 flex items-center"
                >
                  Esci
                </button>
              </div>
            ) : (
              <a
                href={getLoginUrl()}
                className="px-6 py-2 font-display text-sm tracking-widest border-l-[2px] border-black bg-black text-white hover:bg-gray-800 transition-colors h-16 md:h-20 flex items-center"
              >
                Accedi
              </a>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden px-4 border-l-[2px] border-black h-16 flex items-center"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t-[3px] border-black">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-6 py-4 font-display text-lg tracking-widest border-b-[2px] border-black hover:bg-black hover:text-white transition-colors ${location === link.href ? "bg-black text-white" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-6 py-4 font-display text-lg tracking-widest border-b-[2px] border-black hover:bg-black hover:text-white transition-colors">
                  Dashboard
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-6 py-4 font-display text-lg tracking-widest border-b-[2px] border-black bg-black text-white">
                    Admin
                  </Link>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left px-6 py-4 font-display text-lg tracking-widest border-b-[2px] border-black hover:bg-black hover:text-white transition-colors">
                  Esci
                </button>
              </>
            ) : (
              <a href={getLoginUrl()} className="block px-6 py-4 font-display text-lg tracking-widest bg-black text-white">
                Accedi
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
