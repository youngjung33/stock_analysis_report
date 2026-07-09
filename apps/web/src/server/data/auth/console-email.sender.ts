import { IEmailSenderPort } from '../../domain/ports/email-sender.port';

/** 개발·테스트 — 콘솔에 메일 내용 출력 */
export class ConsoleEmailSender implements IEmailSenderPort {
  async send(input: { to: string; subject: string; text: string; html?: string }) {
    console.info('[email]', JSON.stringify({ to: input.to, subject: input.subject, text: input.text }));
  }
}
