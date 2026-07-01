import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { GlobalModule } from './global/global.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LibraryModule } from './modules/library/library.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { RubricModule } from './modules/rubric/rubric.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { ArticleModule } from './modules/article/article.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatsModule } from './modules/stats/stats.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NestScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') ?? 'mongodb://127.0.0.1:27017/lms',
      }),
    }),
    GlobalModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    LibraryModule,
    QuestionBankModule,
    RubricModule,
    ExerciseModule,
    ArticleModule,
    SettingsModule,
    StatsModule,
    NotificationsModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
