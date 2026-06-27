import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExerciseFolderDto {
  @ApiProperty({ example: 'Đề thi học kỳ' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string;
}
