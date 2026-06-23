import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ExerciseStatus, ExerciseType } from '../../../enums';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bài tập đọc hiểu tuần 1' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  type: ExerciseType;

  @ApiPropertyOptional({ enum: ExerciseStatus, default: ExerciseStatus.Open })
  @IsOptional()
  @IsEnum(ExerciseStatus)
  status?: ExerciseStatus;

  @ApiPropertyOptional({ type: String, default: 'Tiếng Việt' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: String, example: 'Lớp 5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ type: Number, default: 0, description: 'phút · 0 = không giới hạn' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  showAnswer?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];
}
