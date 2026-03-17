import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContact = trpc.contacts.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Compila tutti i campi");
      return;
    }

    setIsSubmitting(true);
    try {
      await createContact.mutateAsync(formData);
      toast.success("Messaggio inviato! Ti risponderò entro 24 ore.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {/* Hero Section */}
      <section className="border-b-[3px] border-black py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-7xl md:text-8xl font-black mb-6">
            CONTATTAMI
          </h1>
          <p className="font-mono text-lg text-gray-700 max-w-2xl">
            Hai domande sui miei servizi? Vuoi discutere del tuo progetto? 
            Inviami un messaggio e ti risponderò entro 24 ore.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Field */}
            <div>
              <label className="font-display text-sm tracking-widest uppercase mb-3 block">
                Nome
              </label>
              <Input
                type="text"
                placeholder="Il tuo nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-[2px] border-black text-lg py-6 px-4 font-mono"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="font-display text-sm tracking-widest uppercase mb-3 block">
                Email
              </label>
              <Input
                type="email"
                placeholder="tua.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white border-[2px] border-black text-lg py-6 px-4 font-mono"
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="font-display text-sm tracking-widest uppercase mb-3 block">
                Messaggio
              </label>
              <Textarea
                placeholder="Scrivi il tuo messaggio..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-white border-[2px] border-black text-lg py-4 px-4 font-mono min-h-[200px]"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white font-display text-lg py-6 font-black tracking-widest hover:bg-gray-900 transition-colors"
            >
              {isSubmitting ? "INVIO IN CORSO..." : "INVIA MESSAGGIO"}
            </Button>
          </form>

          {/* Info Section */}
          <div className="mt-20 pt-20 border-t-[2px] border-black">
            <h2 className="font-display text-3xl font-black mb-8">ALTRE MODALITÀ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="font-display text-xs tracking-widest uppercase text-gray-600 mb-2">Email</p>
                <a href="mailto:federicohrdi@gmail.com" className="font-mono text-lg text-black hover:underline">
                  federicohrdi@gmail.com
                </a>
              </div>
              <div>
                <p className="font-display text-xs tracking-widest uppercase text-gray-600 mb-2">Instagram</p>
                <a href="https://www.instagram.com/federico_accardi" target="_blank" rel="noopener noreferrer" className="font-mono text-lg text-black hover:underline">
                  @federico_accardi
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
