import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Upload, Mic, MicOff, Download, Brain, FileAudio, CheckCircle, Clock, RefreshCw, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const STATUS_CONFIG = {
  pending_payment: { label: "IN ATTESA PAGAMENTO", icon: <Clock size={14} />, bg: "bg-gray-100", text: "text-gray-600" },
  paid: { label: "PAGATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  in_progress: { label: "IN LAVORAZIONE", icon: <RefreshCw size={14} />, bg: "bg-black", text: "text-white" },
  revision: { label: "REVISIONE", icon: <AlertCircle size={14} />, bg: "bg-gray-800", text: "text-white" },
  delivered: { label: "CONSEGNATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  completed: { label: "COMPLETATO", icon: <CheckCircle size={14} />, bg: "bg-black", text: "text-white" },
  cancelled: { label: "ANNULLATO", icon: <XCircle size={14} />, bg: "bg-gray-200", text: "text-gray-500" },
} as const;

interface Props { params: { id: string } }

export default function OrderDetail({ params }: Props) {
  const orderId = parseInt(params.id);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: orderId }, { enabled: isAuthenticated && !isNaN(orderId) });

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<Record<number, unknown>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const saveUpload = trpc.uploads.saveUpload.useMutation({
    onSuccess: () => { utils.orders.getById.invalidate({ id: orderId }); toast.success("File caricato con successo"); },
    onError: (e) => toast.error("Errore upload", { description: e.message }),
  });

  const analyzeAI = trpc.uploads.analyzeWithAI.useMutation({
    onSuccess: (data, variables) => {
      setIsAnalyzing(null);
      setAiResult((prev) => ({ ...prev, [variables.fileId]: data }));
      toast.success("Analisi AI completata");
    },
    onError: (e) => { setIsAnalyzing(null); toast.error("Errore analisi AI", { description: e.message }); },
  });

  const transcribeVoice = trpc.voiceNotes.transcribe.useMutation({
    onSuccess: () => { utils.orders.getById.invalidate({ id: orderId }); toast.success("Nota vocale trascritta"); },
    onError: (e) => toast.error("Errore trascrizione", { description: e.message }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["audio/wav", "audio/mpeg", "audio/flac", "audio/x-flac", "audio/mp3"];
    if (!allowed.some((t) => file.type.includes(t.split("/")[1]) || file.name.toLowerCase().endsWith(`.${t.split("/")[1]}`))) {
      toast.error("Formato non supportato", { description: "Usa WAV, MP3 o FLAC" });
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast.error("File troppo grande", { description: "Massimo 200MB" });
      return;
    }

    setIsUploading(true);
    try {
      // Upload to S3 via server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId.toString());

      const res = await fetch("/api/upload-audio", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload fallito");
      const { key, url } = await res.json();

      await saveUpload.mutateAsync({ orderId, fileName: file.name, fileKey: key, fileUrl: url, fileSize: file.size, mimeType: file.type });
    } catch (err) {
      toast.error("Errore upload", { description: err instanceof Error ? err.message : "Riprova" });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, `voice-note-${Date.now()}.webm`);
        formData.append("orderId", orderId.toString());

        try {
          const res = await fetch("/api/upload-audio", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Upload fallito");
          const { key, url } = await res.json();
          await transcribeVoice.mutateAsync({ orderId, audioKey: key, audioUrl: url });
        } catch (err) {
          toast.error("Errore nota vocale", { description: err instanceof Error ? err.message : "Riprova" });
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      toast.error("Microfono non disponibile");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  if (!isAuthenticated || isNaN(orderId)) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="font-display text-3xl text-gray-300 animate-pulse">CARICAMENTO...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="font-display text-6xl text-gray-200 mb-4">404</div>
          <p className="font-mono text-sm text-gray-500 mb-6">Ordine non trovato</p>
          <Link href="/dashboard" className="font-display text-sm tracking-widest border-[2px] border-black px-6 py-3 hover:bg-black hover:text-white transition-colors">
            ← TORNA ALLA DASHBOARD
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const canUpload = ["paid", "in_progress", "revision"].includes(order.status);
  const clientFiles = order.uploads?.filter((u) => u.uploadType === "client_source") ?? [];
  const finalFiles = order.uploads?.filter((u) => u.uploadType === "admin_final") ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <section className="border-b-[5px] border-black">
        <div className="container py-12">
          <Link href="/dashboard" className="font-mono text-xs tracking-widest text-gray-400 hover:text-black transition-colors mb-6 inline-block">
            ← DASHBOARD
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs tracking-[0.4em] text-gray-400 mb-2">ORDINE #{order.id.toString().padStart(4, "0")}</div>
              <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-none">DETTAGLIO<br />ORDINE</h1>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest ${status.bg} ${status.text}`}>
              {status.icon} {status.label}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-[3px] border-black">
          {/* Main content */}
          <div className="lg:col-span-2 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black">

            {/* Order items */}
            <div className="border-b-[3px] border-black">
              <div className="px-6 py-4 border-b-[3px] border-black bg-black text-white">
                <div className="font-display text-sm tracking-widest">SERVIZI ORDINATI</div>
              </div>
              {order.items?.map((item, idx) => (
                <div key={item.id} className={`flex justify-between items-center p-6 ${idx < (order.items?.length ?? 0) - 1 ? "border-b-[3px] border-black" : ""}`}>
                  <div>
                    <div className="font-display text-xl leading-none">{item.serviceName}</div>
                    <div className="font-mono text-xs text-gray-400 mt-1">Qtà: {item.quantity}</div>
                  </div>
                  <div className="font-display text-2xl">€{Number(item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Upload files */}
            {canUpload && (
              <div className="border-b-[3px] border-black">
                <div className="px-6 py-4 border-b-[3px] border-black">
                  <div className="font-display text-sm tracking-widest">CARICA FILE AUDIO</div>
                </div>
                <div className="p-6">
                  <label className={`flex flex-col items-center justify-center gap-4 border-[3px] border-dashed border-black p-8 cursor-pointer hover:bg-gray-50 transition-colors ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload size={40} strokeWidth={1.5} className="text-gray-400" />
                    <div className="text-center">
                      <div className="font-display text-lg">TRASCINA O CLICCA</div>
                      <div className="font-mono text-xs text-gray-400 mt-1">WAV, MP3, FLAC — Max 200MB</div>
                    </div>
                    {isUploading && <div className="font-mono text-xs text-gray-500 animate-pulse">CARICAMENTO IN CORSO...</div>}
                    <input type="file" className="hidden" accept=".wav,.mp3,.flac,audio/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>

                  {clientFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="font-mono text-xs tracking-[0.3em] text-gray-400 mb-3">FILE CARICATI</div>
                      <div className="flex flex-col gap-2">
                        {clientFiles.map((f) => (
                          <div key={f.id} className="flex items-center justify-between p-3 border-[2px] border-black">
                            <div className="flex items-center gap-3">
                              <FileAudio size={16} strokeWidth={1.5} />
                              <div>
                                <div className="font-mono text-sm">{f.fileName}</div>
                                {f.fileSize && <div className="font-mono text-xs text-gray-400">{(f.fileSize / 1024 / 1024).toFixed(1)} MB</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {f.aiAnalysis ? (
                                <button
                                  onClick={() => setAiResult((prev) => ({ ...prev, [f.id]: JSON.parse(f.aiAnalysis!) }))}
                                  className="flex items-center gap-1 px-3 py-1 font-mono text-xs border-[2px] border-black hover:bg-black hover:text-white transition-colors"
                                >
                                  <Brain size={12} /> ANALISI
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setIsAnalyzing(f.id); analyzeAI.mutate({ fileId: f.id, fileName: f.fileName }); }}
                                  disabled={isAnalyzing === f.id}
                                  className="flex items-center gap-1 px-3 py-1 font-mono text-xs border-[2px] border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                                >
                                  <Brain size={12} /> {isAnalyzing === f.id ? "ANALISI..." : "ANALIZZA AI"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis results */}
                  {Object.entries(aiResult).map(([fileId, analysis]) => {
                    const a = analysis as { overallAssessment?: string; eq?: { suggestion: string; frequencies: string[] }; compression?: { suggestion: string; ratio: string; attack: string; release: string }; stereoWidth?: { suggestion: string; recommendation: string }; loudness?: { suggestion: string; targetLUFS: number }; additionalNotes?: string[] };
                    return (
                      <div key={fileId} className="mt-4 border-[3px] border-black">
                        <div className="px-4 py-3 bg-black text-white border-b-[3px] border-black flex items-center gap-2">
                          <Brain size={16} /> <span className="font-display text-sm tracking-widest">ANALISI AI</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                          {a.overallAssessment && (
                            <div>
                              <div className="font-mono text-xs tracking-widest text-gray-400 mb-1">VALUTAZIONE GENERALE</div>
                              <p className="text-sm leading-relaxed">{a.overallAssessment}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {a.eq && (
                              <div className="border-[2px] border-black p-3">
                                <div className="font-display text-sm mb-2">EQUALIZZAZIONE</div>
                                <p className="font-mono text-xs text-gray-600 mb-2">{a.eq.suggestion}</p>
                                <div className="flex flex-wrap gap-1">{a.eq.frequencies?.map((f, i) => <span key={i} className="font-mono text-xs border-[1px] border-black px-2 py-0.5">{f}</span>)}</div>
                              </div>
                            )}
                            {a.compression && (
                              <div className="border-[2px] border-black p-3">
                                <div className="font-display text-sm mb-2">COMPRESSIONE</div>
                                <p className="font-mono text-xs text-gray-600 mb-2">{a.compression.suggestion}</p>
                                <div className="font-mono text-xs text-gray-500">Ratio: {a.compression.ratio} | Attack: {a.compression.attack} | Release: {a.compression.release}</div>
                              </div>
                            )}
                            {a.stereoWidth && (
                              <div className="border-[2px] border-black p-3">
                                <div className="font-display text-sm mb-2">STEREO WIDTH</div>
                                <p className="font-mono text-xs text-gray-600">{a.stereoWidth.suggestion}</p>
                                <div className="font-mono text-xs text-gray-500 mt-1">{a.stereoWidth.recommendation}</div>
                              </div>
                            )}
                            {a.loudness && (
                              <div className="border-[2px] border-black p-3">
                                <div className="font-display text-sm mb-2">LOUDNESS</div>
                                <p className="font-mono text-xs text-gray-600">{a.loudness.suggestion}</p>
                                <div className="font-mono text-xs text-gray-500 mt-1">Target: {a.loudness.targetLUFS} LUFS</div>
                              </div>
                            )}
                          </div>
                          {a.additionalNotes && a.additionalNotes.length > 0 && (
                            <div>
                              <div className="font-mono text-xs tracking-widest text-gray-400 mb-2">NOTE AGGIUNTIVE</div>
                              <ul className="flex flex-col gap-1">{a.additionalNotes.map((note, i) => <li key={i} className="font-mono text-xs text-gray-600">→ {note}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Voice notes */}
            {canUpload && (
              <div className="border-b-[3px] border-black">
                <div className="px-6 py-4 border-b-[3px] border-black">
                  <div className="font-display text-sm tracking-widest">NOTE VOCALI</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={transcribeVoice.isPending}
                      className={`flex items-center gap-3 px-6 py-3 font-display text-sm tracking-widest border-[3px] border-black transition-colors ${isRecording ? "bg-black text-white animate-pulse" : "hover:bg-black hover:text-white"} disabled:opacity-50`}
                    >
                      {isRecording ? <><MicOff size={18} /> STOP REGISTRAZIONE</> : <><Mic size={18} /> REGISTRA NOTA VOCALE</>}
                    </button>
                    {transcribeVoice.isPending && <div className="font-mono text-xs text-gray-400 animate-pulse">TRASCRIZIONE IN CORSO...</div>}
                  </div>
                  <p className="font-mono text-xs text-gray-400">Registra istruzioni vocali per il tuo ordine. Verranno trascritte automaticamente con AI.</p>

                  {order.voiceNotes && order.voiceNotes.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                      {order.voiceNotes.map((note) => (
                        <div key={note.id} className="border-[2px] border-black p-4">
                          <div className="font-mono text-xs text-gray-400 mb-2">
                            {new Date(note.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {note.transcription ? (
                            <p className="text-sm leading-relaxed">"{note.transcription}"</p>
                          ) : (
                            <p className="font-mono text-xs text-gray-400 italic">Trascrizione non disponibile</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final files */}
            {finalFiles.length > 0 && (
              <div>
                <div className="px-6 py-4 border-b-[3px] border-black bg-black text-white">
                  <div className="font-display text-sm tracking-widest">FILE FINALI — PRONTO PER IL DOWNLOAD</div>
                </div>
                <div className="p-6 flex flex-col gap-3">
                  {finalFiles.map((f) => (
                    <a
                      key={f.id}
                      href={f.fileUrl}
                      download={f.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border-[3px] border-black hover:bg-black hover:text-white transition-colors group shadow-brutal hover-brutal"
                    >
                      <div className="flex items-center gap-3">
                        <FileAudio size={20} strokeWidth={1.5} />
                        <span className="font-display text-lg">{f.fileName}</span>
                      </div>
                      <Download size={20} strokeWidth={2} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b-[3px] border-black bg-black text-white">
              <div className="font-display text-sm tracking-widest">INFO ORDINE</div>
            </div>
            <div className="p-6 flex flex-col gap-4 border-b-[3px] border-black">
              <div>
                <div className="font-mono text-xs text-gray-400 mb-1">DATA ORDINE</div>
                <div className="font-display text-lg">{new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-400 mb-1">TOTALE</div>
                <div className="font-display text-4xl leading-none">€{Number(order.totalAmount).toFixed(2)}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-400 mb-1">STATO</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-xs tracking-widest ${status.bg} ${status.text}`}>
                  {status.icon} {status.label}
                </div>
              </div>
              {order.notes && (
                <div>
                  <div className="font-mono text-xs text-gray-400 mb-1">NOTE</div>
                  <p className="font-mono text-xs text-gray-600 leading-relaxed">{order.notes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div className="border-t-[2px] border-black pt-4">
                  <div className="font-mono text-xs text-gray-400 mb-1">NOTE DALL'INGEGNERE</div>
                  <p className="font-mono text-xs text-gray-600 leading-relaxed">{order.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
