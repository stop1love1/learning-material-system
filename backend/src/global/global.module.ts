import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';
import { BcryptService } from './bcrypt.service';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        // jsonwebtoken accepts strings like '7d'; its TS type is overly strict.
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as unknown as number },
      }),
    }),
  ],
  providers: [JwtService, BcryptService, MailService],
  exports: [JwtService, BcryptService, MailService, JwtModule],
})
export class GlobalModule {}
