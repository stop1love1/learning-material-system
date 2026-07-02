import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, ValidateIf } from 'class-validator';

export class ListFoldersDto {
  @ApiPropertyOptional({ type: String, nullable: true, description: 'null/empty = thư mục gốc' })
  // Treat undefined / null / '' all as "root" — only validate a non-empty value.
  @ValidateIf((o) => o.parentId !== undefined && o.parentId !== null && o.parentId !== '')
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({ type: Boolean, description: 'true/1 = trả về mọi thư mục (bỏ lọc parentId)' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1' || value === 1)
  @IsBoolean()
  all?: boolean;
}
