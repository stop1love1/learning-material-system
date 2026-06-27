import { PartialType } from '@nestjs/swagger';
import { CreateExerciseFolderDto } from './create-exercise-folder.dto';

export class UpdateExerciseFolderDto extends PartialType(CreateExerciseFolderDto) {}
