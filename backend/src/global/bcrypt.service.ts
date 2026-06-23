import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/** Password hashing (tái dùng từ reference `bcrypt.service`). */
@Injectable()
export class BcryptService {
  hash(data: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(data, saltRounds);
  }

  compare(data: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(data, hashed);
  }
}
