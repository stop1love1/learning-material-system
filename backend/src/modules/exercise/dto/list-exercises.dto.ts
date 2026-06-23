import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { ExerciseStatus, ExerciseType } from '../../../enums';

export class ListExercisesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ExerciseType)
  @ApiPropertyOptional({ enum: ExerciseType })
  type?: ExerciseType;

  @IsOptional()
  @IsEnum(ExerciseStatus)
  @ApiPropertyOptional({ enum: ExerciseStatus })
  status?: ExerciseStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  subject?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  grade?: string;
}
