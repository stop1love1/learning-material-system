import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { SelfAssessmentController } from './self-assessment.controller';
import { SelfAssessmentService } from './self-assessment.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  controllers: [ExercisesController, AttemptsController, SelfAssessmentController, ParticipantsController],
  providers: [ExercisesService, AttemptsService, SelfAssessmentService, ParticipantsService],
  exports: [ExercisesService, AttemptsService, SelfAssessmentService, ParticipantsService],
})
export class ExerciseModule {}
