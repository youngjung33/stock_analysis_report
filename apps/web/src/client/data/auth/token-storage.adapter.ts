import { ITokenStoragePort } from '../../domain/repositories';
import { tokenStorage } from './token-storage';

export class TokenStorageAdapter implements ITokenStoragePort {
  getAccessToken() {
    return tokenStorage.getAccessToken();
  }
}

export const tokenStorageAdapter = new TokenStorageAdapter();
