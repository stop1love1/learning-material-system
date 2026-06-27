import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { ExerciseFoldersController } from './exercise-folders.controller';
import { ExerciseFoldersService } from './exercise-folders.service';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { SelfAssessmentController } from './self-assessment.controller';
import { SelfAssessmentService } from './self-assessment.service';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  controllers: [
    ExercisesController,
    ExerciseFoldersController,
    AttemptsController,
    SelfAssessmentController,
    ParticipantsController,
  ],
  providers: [
    ExercisesService,
    ExerciseFoldersService,
    AttemptsService,
    SelfAssessmentService,
    ParticipantsService,
  ],
  exports: [
    ExercisesService,
    ExerciseFoldersService,
    AttemptsService,
    SelfAssessmentService,
    ParticipantsService,
  ],
})
export class ExerciseModule {}
