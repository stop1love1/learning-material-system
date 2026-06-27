import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

/**
 * Scheduled background maintenance jobs. Models are injected directly (DatabaseModule is
 * @Global) and MailService comes from GlobalModule. ScheduleModule.forRoot() in AppModule
 * activates the @Cron decorators on MaintenanceService.
 */
@Module({
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
