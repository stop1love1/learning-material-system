import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { parseKeyword } from '../utils';

/** Query phân trang chuẩn cho mọi endpoint list. */
export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseKeyword(value))
  @ApiPropertyOptional({ type: String })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: Number, default: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: Number, default: 10 })
  pageSize?: number;
}
