import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { SelfAssessmentController } from './self-assessment.controller';
import { SelfAssessmentService } from './self-assessment.service';

@Module({
  controllers: [ExercisesController, AttemptsController, SelfAssessmentController],
  providers: [ExercisesService, AttemptsService, SelfAssessmentService],
  exports: [ExercisesService, AttemptsService, SelfAssessmentService],
})
export class ExerciseModule {}
