import { PartialType } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto';

// All fields optional.
export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}
