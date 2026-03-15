import type { Express, Response } from "express";
import type { Request } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/flac", "audio/x-flac", "audio/webm", "audio/ogg", "audio/m4a", "audio/mp4"];
    const ext = file.originalname.toLowerCase();
    const isAllowed = allowed.some((t) => file.mimetype.includes(t.split("/")[1])) ||
      ext.endsWith(".wav") || ext.endsWith(".mp3") || ext.endsWith(".flac") || ext.endsWith(".webm") || ext.endsWith(".m4a");
    if (isAllowed) cb(null, true);
    else cb(new Error("Formato non supportato. Usa WAV, MP3, FLAC, WebM."));
  },
});

export function registerUploadRoute(app: Express) {
  app.post("/api/upload-audio", upload.single("file"), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nessun file ricevuto" });
        return;
      }

      const orderId = req.body.orderId ?? "unknown";
      const suffix = nanoid(8);
      const ext = req.file.originalname.split(".").pop() ?? "audio";
      const key = `orders/${orderId}/audio/${Date.now()}-${suffix}.${ext}`;

      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype || "audio/octet-stream");

      res.json({ key, url, fileName: req.file.originalname, fileSize: req.file.size });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore upload";
      console.error("[Upload] Error:", message);
      res.status(500).json({ error: message });
    }
  });
}
