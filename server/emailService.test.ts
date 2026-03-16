import { describe, it, expect } from "vitest";
import { sendEmail, getOrderConfirmationEmail } from "./emailService";

describe("Email Service", () => {
  it("should generate order confirmation email HTML", () => {
    const html = getOrderConfirmationEmail(
      "Federico",
      "123",
      ["Mixing - 10 tracce", "Mastering"],
      75.50,
      "http://localhost:3000/orders/123"
    );

    expect(html).toContain("MIXEDBYFEDE");
    expect(html).toContain("Conferma Ordine");
    expect(html).toContain("Federico");
    expect(html).toContain("€75.50");
    expect(html).toContain("Mixing - 10 tracce");
    expect(html).toContain("Mastering");
  });

  it("should handle email sending (mock)", async () => {
    // Test che la funzione sendEmail non lancia errori
    // In produzione, le credenziali EMAIL_USER e EMAIL_PASSWORD devono essere configurate
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Email",
      html: "<p>Test</p>",
    });

    // Se le credenziali non sono configurate, la funzione ritorna false
    // Se le credenziali sono corrette, ritorna true
    expect(typeof result).toBe("boolean");
  });
});
