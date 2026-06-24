import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SelfAssessmentSource } from '../../../enums';

export class SelfAssessmentScoreDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  criterionId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsMongoId()
  levelId?: string;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;
}

export class CreateSelfAssessmentDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  rubricId: string;

  @ApiProperty({ enum: SelfAssessmentSource })
  @IsEnum(SelfAssessmentSource)
  source: SelfAssessmentSource;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  fileId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  exerciseId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ type: [SelfAssessmentScoreDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelfAssessmentScoreDto)
  scores?: SelfAssessmentScoreDto[];

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  totalPercent?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  note?: string;
}
