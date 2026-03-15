# MixedByFede – TODO

## Schema & Backend
- [x] Schema DB: services, orders, order_items, cart_items, file_uploads, voice_notes, testimonials, portfolio_items
- [x] Migration SQL e applicazione al DB
- [x] tRPC router: services (list, get)
- [x] tRPC router: cart (add, remove, get, clear)
- [x] tRPC router: orders (create, list, get, updateStatus, checkout Stripe)
- [x] tRPC router: uploads (save metadata, list per ordine, analisi AI)
- [x] tRPC router: portfolio & testimonials (list, admin CRUD)
- [x] tRPC router: AI analysis (analizza traccia con LLM)
- [x] tRPC router: voice notes (trascrizione Speech-to-Text)
- [x] tRPC router: admin (gestione ordini, upload file finali)
- [x] Notifiche owner per nuovi ordini

## Stripe
- [x] Integrazione Stripe via webdev_add_feature
- [x] Checkout session creation
- [x] Webhook per conferma pagamento
- [x] Gestione stato pagamento negli ordini

## Upload File
- [x] Endpoint Express /api/upload-audio con multer + S3
- [x] Supporto WAV, MP3, FLAC, WebM (max 200MB)

## Frontend – Design System Brutalist
- [x] Palette: nero assoluto #000 su bianco puro #fff
- [x] Font: Space Grotesk, Bebas Neue, Space Mono
- [x] Global CSS: variabili, reset, shadow-brutal, text-stroke, marquee
- [x] Navbar brutalist con logo, navigazione, carrello e autenticazione
- [x] Footer brutalist

## Frontend – Pagine
- [x] Homepage: hero brutalist, statistiche, intro servizi, processo, CTA
- [x] Pagina Servizi: catalogo completo per categoria con card prezzi e pacchetti
- [x] Pagina Carrello: riepilogo, note ordine, totale, checkout Stripe
- [x] Portfolio / Showcase con griglia lavori e testimonianze
- [x] Dashboard Utente: ordini attivi, storico, statistiche
- [x] Dettaglio Ordine: upload file audio, analisi AI, note vocali, download file finali
- [x] Area Admin: gestione ordini (stato, note, upload file finali), portfolio, testimonianze

## Routing
- [x] App.tsx con tutte le route registrate

## Dati di esempio
- [x] 6 servizi (mixing starter/pro/premium, mastering starter/pro, mixing+mastering)
- [x] 4 portfolio items
- [x] 4 testimonianze

## Testing
- [x] Test unitari backend: auth, services, cart, orders, portfolio, testimonials, admin (12/12 passati)


## Modifiche Richieste
- [x] Aggiornare 3 servizi: Mix (30/35/40€), Master (20€), Mix+Master (40/45/50€)
- [x] Aggiornare statistiche: 500+ progetti, 4 giorni consegna, 3 revisioni, WAV only, risposta 24h
- [x] Aggiornare contatti: federicohrdi@gmail.com, Instagram @federico_accardi
- [x] Inserire 10 recensioni 5 stelle professionali
- [x] Aggiungere canzone portfolio (Kvrter-Can'tTrust.mp3)
- [x] Aggiornare footer: solo Mixing & Mastering (togliere Produzione)
- [x] Aggiornare marquee: MIXING · MASTERING · RISPOSTA 24H · SOLO WAV
