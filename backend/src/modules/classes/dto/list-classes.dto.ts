import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class ListClassesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, example: '5' })
  grade?: string;
}
