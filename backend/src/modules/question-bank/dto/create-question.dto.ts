import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsObject, IsOptional, IsString } from 'class-validator';
import { QuestionLevel, QuestionType } from '../../../enums';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ enum: QuestionLevel, default: QuestionLevel.Easy })
  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: String, description: 'Nội dung đề bài (stem)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  grade?: string;

  /** Chi tiết theo loại câu hỏi (options, correctOptionIndex, answers, …). */
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  detail: Record<string, any>;
}
