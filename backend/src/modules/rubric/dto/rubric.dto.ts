import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class ListRubricsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Lọc theo nhóm rubric' })
  @IsOptional()
  @IsMongoId()
  groupId?: string;
}

export class LevelDto {
  @ApiPropertyOptional({ type: String, description: 'ID mức (có khi cập nhật)' })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ example: 'Xuất sắc' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CriterionDto {
  @ApiPropertyOptional({ type: String, description: 'ID tiêu chí (có khi cập nhật)' })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiPropertyOptional({ type: String, description: 'ID mức gắn với tiêu chí' })
  @IsOptional()
  @IsString()
  levelId?: string;

  @ApiProperty({ example: 'Tiêu chí 1' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ type: [String], example: ['Yêu cầu 1', 'Yêu cầu 2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

export class RubricDto {
  @ApiPropertyOptional({ type: String, description: 'ID nhóm rubric' })
  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @ApiProperty({ example: 'Tên rubric' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Mô tả rubric' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isChecklist?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  useGrades?: boolean;

  @ApiProperty({
    type: [LevelDto],
    example: [
      { name: 'Xuất sắc', percentage: 100, order: 0 },
      { name: 'Tốt', percentage: 75, order: 1 },
      { name: 'Trung bình', percentage: 50, order: 2 },
      { name: 'Yếu', percentage: 25, order: 3 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelDto)
  levels: LevelDto[];

  @ApiProperty({
    type: [CriterionDto],
    example: [
      {
        name: 'Tiêu chí 1',
        note: '',
        weight: 10,
        order: 0,
        items: ['Yêu cầu 1', 'Yêu cầu 2'],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criterions: CriterionDto[];
}
