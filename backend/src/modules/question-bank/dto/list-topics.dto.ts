import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class ListTopicsDto {
  @ApiPropertyOptional({ type: String, description: 'Lọc theo topic cha (bỏ trống → topic gốc)' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
