import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, ValidateIf } from 'class-validator';

export class ListFoldersDto {
  @ApiPropertyOptional({ type: String, nullable: true, description: 'null/empty = thư mục gốc' })
  // Treat undefined / null / '' all as "root" — only validate a non-empty value.
  @ValidateIf((o) => o.parentId !== undefined && o.parentId !== null && o.parentId !== '')
  @IsMongoId()
  parentId?: string;
}
