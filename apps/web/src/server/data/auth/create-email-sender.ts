import { IEmailSenderPort } from '../../domain/ports/email-sender.port';
import { ConsoleEmailSender } from './console-email.sender';
import { ResendEmailSender } from './resend-email.sender';

/** RESEND_API_KEY 있으면 Resend, 없으면 콘솔 출력 */
export function createEmailSender(): IEmailSenderPort {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) return new ResendEmailSender(apiKey);
  return new ConsoleEmailSender();
}
