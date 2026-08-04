import { IEmailSenderPort } from '../../domain/ports/email-sender.port';

/** Resend API — RESEND_API_KEY 설정 시 프로덕션 메일 발송 */
export class ResendEmailSender implements IEmailSenderPort {
  constructor(
    private readonly apiKey: string,
    private readonly from = process.env.EMAIL_FROM?.trim() || 'SAR Portfolio <onboarding@resend.dev>',
  ) {}

  async send(input: { to: string; subject: string; text: string; html?: string }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }
  }
}
