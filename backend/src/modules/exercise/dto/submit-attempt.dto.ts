import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsMongoId, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  questionId: string;

  @ApiPropertyOptional({ description: 'Đáp án — shape tùy loại câu hỏi' })
  @IsOptional()
  answer?: unknown;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grades?: number;
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
