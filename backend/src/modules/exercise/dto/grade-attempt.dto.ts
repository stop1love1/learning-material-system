import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Điểm + nhận xét giáo viên chấm cho một câu trả lời của học viên. */
export class GradeAnswerDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  questionId: string;

  @ApiPropertyOptional({ type: Number, description: 'Điểm cho câu này' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grades?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({ type: String, description: 'Nhận xét cho câu này' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class GradeAttemptDto {
  @ApiProperty({ type: [GradeAnswerDto], description: 'Điểm theo từng câu' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeAnswerDto)
  answers: GradeAnswerDto[];

  @ApiPropertyOptional({ type: Number, description: 'Tổng điểm (ghi đè nếu có)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalScore?: number;

  @ApiPropertyOptional({ type: Number, description: 'Phần trăm 0–100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;

  @ApiPropertyOptional({ type: String, description: 'Nhận xét chung của giáo viên' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
