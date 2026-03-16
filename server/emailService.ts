import nodemailer from 'nodemailer';
import { ENV } from './_core/env';

// Configurazione transporter email (usa Gmail o servizio email configurato)
// Per Gmail: abilita "App Passwords" e usa quella come PASSWORD
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'federicohrdi@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Usa variabile d'ambiente
  },
});

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `MixedByFede <${process.env.EMAIL_USER || 'federicohrdi@gmail.com'}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    console.log(`[Email] Sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${params.to}:`, error);
    return false;
  }
}

// Template email per conferma ordine
export function getOrderConfirmationEmail(
  customerName: string,
  orderId: string,
  serviceNames: string[],
  totalPrice: number,
  dashboardUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
          .service-item { padding: 10px 0; border-bottom: 1px solid #eee; }
          .price { font-weight: bold; font-size: 18px; color: #000; }
          .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MIXEDBYFEDE</h1>
            <p>Conferma Ordine</p>
          </div>
          <div class="content">
            <p>Ciao <strong>${customerName}</strong>,</p>
            <p>Grazie per il tuo ordine! Abbiamo ricevuto il pagamento e inizieremo a lavorare al tuo progetto.</p>
            
            <h3>Dettagli Ordine</h3>
            <p><strong>ID Ordine:</strong> ${orderId}</p>
            
            <h3>Servizi Ordinati</h3>
            ${serviceNames.map(s => `<div class="service-item">${s}</div>`).join('')}
            
            <p style="margin-top: 20px;"><strong>Totale:</strong> <span class="price">€${totalPrice.toFixed(2)}</span></p>
            
            <p style="margin-top: 20px;">Puoi seguire lo stato del tuo ordine dalla tua dashboard:</p>
            <a href="${dashboardUrl}" class="btn">Accedi alla Dashboard</a>
            
            <p style="margin-top: 30px;">Se hai domande, contattaci a <strong>federicohrdi@gmail.com</strong></p>
            <p>Grazie,<br><strong>Federico - MixedByFede</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MixedByFede. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template email per consegna finale
export function getDeliveryEmail(
  customerName: string,
  orderId: string,
  dashboardUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
          .success { color: #27ae60; font-weight: bold; font-size: 18px; }
          .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MIXEDBYFEDE</h1>
            <p>File Pronti per il Download</p>
          </div>
          <div class="content">
            <p>Ciao <strong>${customerName}</strong>,</p>
            <p class="success">✓ I tuoi file sono pronti!</p>
            
            <p>Il tuo ordine <strong>#${orderId}</strong> è stato completato e i file finali sono disponibili per il download.</p>
            
            <p>Accedi alla tua dashboard per scaricare i file:</p>
            <a href="${dashboardUrl}" class="btn">Scarica i File</a>
            
            <p style="margin-top: 20px;">Se hai domande o feedback, non esitare a contattarci a <strong>federicohrdi@gmail.com</strong></p>
            <p>Grazie per aver scelto MixedByFede!<br><strong>Federico</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MixedByFede. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template email per nuovo ordine (admin)
export function getAdminNewOrderEmail(
  orderId: string,
  customerName: string,
  customerEmail: string,
  serviceNames: string[],
  totalPrice: number,
  adminUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
          .alert { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
          .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MIXEDBYFEDE - ADMIN</h1>
            <p>Nuovo Ordine Ricevuto</p>
          </div>
          <div class="content">
            <div class="alert">
              <strong>⚠️ Nuovo ordine ricevuto!</strong>
            </div>
            
            <h3>Dettagli Cliente</h3>
            <p><strong>Nome:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            
            <h3>Dettagli Ordine</h3>
            <p><strong>ID Ordine:</strong> ${orderId}</p>
            <p><strong>Servizi:</strong></p>
            <ul>
              ${serviceNames.map(s => `<li>${s}</li>`).join('')}
            </ul>
            <p><strong>Totale:</strong> €${totalPrice.toFixed(2)}</p>
            
            <p style="margin-top: 20px;">Accedi al pannello admin per gestire l'ordine:</p>
            <a href="${adminUrl}" class="btn">Vai al Pannello Admin</a>
          </div>
          <div class="footer">
            <p>&copy; 2026 MixedByFede. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template email per revisione ricevuta (admin)
export function getAdminReviewEmail(
  orderId: string,
  customerName: string,
  reviewNote: string,
  adminUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
          .review-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
          .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MIXEDBYFEDE - ADMIN</h1>
            <p>Nuova Revisione Ricevuta</p>
          </div>
          <div class="content">
            <p><strong>Ordine #${orderId}</strong> - Cliente: <strong>${customerName}</strong></p>
            
            <div class="review-box">
              <h3>Nota di Revisione:</h3>
              <p>${reviewNote}</p>
            </div>
            
            <p>Accedi al pannello admin per visualizzare i dettagli completi:</p>
            <a href="${adminUrl}" class="btn">Vai al Pannello Admin</a>
          </div>
          <div class="footer">
            <p>&copy; 2026 MixedByFede. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Template email per contenuto caricato (admin)
export function getAdminUploadEmail(
  orderId: string,
  customerName: string,
  fileName: string,
  adminUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
          .file-box { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MIXEDBYFEDE - ADMIN</h1>
            <p>File Caricato</p>
          </div>
          <div class="content">
            <p><strong>Ordine #${orderId}</strong> - Cliente: <strong>${customerName}</strong></p>
            
            <div class="file-box">
              <h3>📁 File Caricato:</h3>
              <p><strong>${fileName}</strong></p>
            </div>
            
            <p>Accedi al pannello admin per scaricare il file e iniziare la lavorazione:</p>
            <a href="${adminUrl}" class="btn">Vai al Pannello Admin</a>
          </div>
          <div class="footer">
            <p>&copy; 2026 MixedByFede. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
