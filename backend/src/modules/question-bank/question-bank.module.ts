import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  controllers: [TopicsController, QuestionsController],
  providers: [TopicsService, QuestionsService],
  exports: [TopicsService, QuestionsService],
})
export class QuestionBankModule {}
