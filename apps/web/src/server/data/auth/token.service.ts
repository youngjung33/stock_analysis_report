import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { ITokenService } from '../../domain/repositories';
import { AuthenticationError } from '../../domain/errors/domain.errors';

export class JwtTokenService implements ITokenService {
  generateAccessToken(payload: { sub: string; username: string }): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
    const options: SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, secret, options);
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  verifyAccessToken(token: string): { sub: string; username: string } {
    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
      return jwt.verify(token, secret) as { sub: string; username: string };
    } catch {
      throw new AuthenticationError('Invalid access token');
    }
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export class BcryptPasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
