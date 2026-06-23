import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

// Tạo admin mặc định. Chạy: `pnpm seed` (cần MongoDB đang chạy).
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  await app.get(UsersService).seedAdmin();
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  Logger.error(err instanceof Error ? err.message : String(err), 'Seed');
  process.exit(1);
});
