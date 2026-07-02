import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'Cách viết bài văn tả cảnh' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: String, example: 'Hoạt động Viết' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: String, example: 'clay' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: Number, example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readMinutes?: number;
}
