import { IAuthSessionPort } from '../../domain/repositories';
import { tokenStorage } from './token-storage';

export class AuthSessionAdapter implements IAuthSessionPort {
  onUnauthorized(callback: () => void): void {
    tokenStorage.onUnauthorized(callback);
  }
}

export const authSessionAdapter = new AuthSessionAdapter();
