import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// User model comes from the global DatabaseModule; JwtService/BcryptService from GlobalModule.
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
