import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ example: 'Luyện từ và câu — Lớp 4' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ type: String, description: 'ObjectId của topic cha' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;
}
