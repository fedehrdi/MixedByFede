import { createNotification } from "./db";
import { sendEmail } from "./emailService";
import type { InsertNotification } from "../drizzle/schema";

/**
 * Mapping tra stati ordine e configurazione notifiche
 */
const notificationConfig: Record<
  string,
  {
    type: InsertNotification["type"];
    title: string;
    messageTemplate: (orderId: number) => string;
    emailSubject: (orderId: number) => string;
    emailTemplate: (orderId: number, customerName: string) => string;
  }
> = {
  order_created: {
    type: "order_created",
    title: "Ordine Confermato",
    messageTemplate: (orderId) => `Il tuo ordine #${orderId} è stato confermato. Puoi iniziare a caricare i file.`,
    emailSubject: (orderId) => `Ordine Confermato #${orderId} - MixedByFede`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Il tuo ordine <strong>#${orderId}</strong> è stato confermato con successo!</p><p>Puoi accedere al tuo dashboard per caricare i file.</p>`,
  },
  order_in_progress: {
    type: "order_in_progress",
    title: "Elaborazione in Corso",
    messageTemplate: (orderId) => `Il tuo ordine #${orderId} è ora in elaborazione. Stiamo lavorando sui tuoi file.`,
    emailSubject: (orderId) => `Elaborazione in Corso - Ordine #${orderId}`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Abbiamo iniziato a lavorare sul tuo ordine <strong>#${orderId}</strong>.</p><p>Ti notificheremo quando sarà pronto.</p>`,
  },
  order_revision_needed: {
    type: "order_revision_needed",
    title: "Revisione Richiesta",
    messageTemplate: (orderId) => `Il tuo ordine #${orderId} necessita di revisioni. Controlla il dashboard per i dettagli.`,
    emailSubject: (orderId) => `Revisione Richiesta - Ordine #${orderId}`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Abbiamo completato il lavoro iniziale su ordine <strong>#${orderId}</strong>, ma sono necessarie alcune revisioni.</p><p>Accedi al dashboard per visualizzare i dettagli.</p>`,
  },
  order_delivered: {
    type: "order_completed",
    title: "File Pronti per il Download",
    messageTemplate: (orderId) => `Il tuo ordine #${orderId} è pronto! Scarica i tuoi file dal dashboard.`,
    emailSubject: (orderId) => `File Pronti - Ordine #${orderId}`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Il tuo ordine <strong>#${orderId}</strong> è completato!</p><p>I tuoi file sono pronti per il download nel dashboard.</p>`,
  },
  order_completed: {
    type: "order_completed",
    title: "Ordine Completato",
    messageTemplate: (orderId) => `Grazie! Il tuo ordine #${orderId} è stato completato con successo.`,
    emailSubject: (orderId) => `Ordine Completato - #${orderId}`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Grazie per aver scelto MixedByFede! Il tuo ordine <strong>#${orderId}</strong> è completato.</p><p>Se hai domande, non esitare a contattarci.</p>`,
  },
  order_cancelled: {
    type: "order_cancelled",
    title: "Ordine Annullato",
    messageTemplate: (orderId) => `Il tuo ordine #${orderId} è stato annullato.`,
    emailSubject: (orderId) => `Ordine Annullato - #${orderId}`,
    emailTemplate: (orderId, name) =>
      `<p>Ciao ${name},</p><p>Il tuo ordine <strong>#${orderId}</strong> è stato annullato.</p><p>Se hai domande, contattaci pure.</p>`,
  },
};

/**
 * Invia una notifica automatica quando lo stato di un ordine cambia
 */
export async function notifyOrderStatusChange(
  orderId: number,
  userId: number,
  newStatus: string,
  customerEmail?: string,
  customerName?: string
) {
  const config = notificationConfig[newStatus];

  if (!config) {
    console.warn(`[Notification] No notification config for status: ${newStatus}`);
    return;
  }

  try {
    // Crea notifica nel database
    await createNotification({
      userId,
      orderId,
      type: config.type,
      title: config.title,
      message: config.messageTemplate(orderId),
      actionUrl: `/orders/${orderId}`,
    });

    // Invia email se disponibile
    if (customerEmail && customerName) {
      await sendEmail({
        to: customerEmail,
        subject: config.emailSubject(orderId),
        html: config.emailTemplate(orderId, customerName),
      });
    }

    console.log(`[Notification] Sent notification for order #${orderId} status: ${newStatus}`);
  } catch (error) {
    console.error(`[Notification] Error sending notification for order #${orderId}:`, error);
  }
}

/**
 * Invia notifica di pagamento ricevuto
 */
export async function notifyPaymentReceived(
  orderId: number,
  userId: number,
  customerEmail?: string,
  customerName?: string
) {
  try {
    await createNotification({
      userId,
      orderId,
      type: "payment_received",
      title: "Pagamento Ricevuto",
      message: `Abbiamo ricevuto il pagamento per l'ordine #${orderId}. Inizieremo a lavorarci a breve.`,
      actionUrl: `/orders/${orderId}`,
    });

    if (customerEmail && customerName) {
      await sendEmail({
        to: customerEmail,
        subject: `Pagamento Ricevuto - Ordine #${orderId}`,
        html: `<p>Ciao ${customerName},</p><p>Abbiamo ricevuto il pagamento per il tuo ordine <strong>#${orderId}</strong>.</p><p>Inizieremo a lavorarci immediatamente!</p>`,
      });
    }

    console.log(`[Notification] Payment notification sent for order #${orderId}`);
  } catch (error) {
    console.error(`[Notification] Error sending payment notification:`, error);
  }
}

/**
 * Invia notifica di nuovo contatto ricevuto (per admin)
 */
export async function notifyNewContact(
  adminUserId: number,
  senderName: string,
  senderEmail: string,
  message: string,
  adminEmail?: string
) {
  try {
    await createNotification({
      userId: adminUserId,
      type: "contact_received",
      title: `Nuovo Messaggio da ${senderName}`,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      actionUrl: `/admin/contacts`,
    });

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Nuovo Messaggio di Contatto da ${senderName}`,
        html: `<p><strong>${senderName}</strong> (${senderEmail}) ha inviato un messaggio:</p><p>${message}</p>`,
      });
    }

    console.log(`[Notification] New contact notification sent`);
  } catch (error) {
    console.error(`[Notification] Error sending contact notification:`, error);
  }
}
