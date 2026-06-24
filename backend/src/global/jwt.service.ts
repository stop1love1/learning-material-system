import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from '../common/types';

@Injectable()
export class JwtService {
  constructor(private readonly jwt: NestJwtService) {}

  sign(payload: Pick<JwtPayload, 'sub' | 'role' | 'email' | 'name'>, options?: JwtSignOptions): string {
    return this.jwt.sign(payload, options);
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(extractBearer(token));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Chỉ giải mã (không verify) — dùng khi đã verify ở nơi khác. */
  decode(token: string): JwtPayload | null {
    return this.jwt.decode(extractBearer(token)) as JwtPayload | null;
  }
}

function extractBearer(token?: string): string {
  if (!token) return '';
  return token.replace(/^\s*Bearer\s+/i, '').trim();
}
