import { ITokenStorage } from '../../domain/repositories';

let accessToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;

export class MemoryTokenStorage implements ITokenStorage {
  getAccessToken(): string | null {
    return accessToken;
  }

  setAccessToken(token: string | null): void {
    accessToken = token;
  }

  onUnauthorized(callback: () => void): void {
    unauthorizedCallback = callback;
  }

  triggerUnauthorized(): void {
    accessToken = null;
    unauthorizedCallback?.();
  }
}

export const tokenStorage = new MemoryTokenStorage();
