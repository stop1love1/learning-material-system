import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class ListTopicsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Lọc theo topic cha (bỏ trống → topic gốc)' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
