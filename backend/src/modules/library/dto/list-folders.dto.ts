import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListFoldersDto {
  @ApiPropertyOptional({ type: String, nullable: true, description: 'null/empty = thư mục gốc' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
