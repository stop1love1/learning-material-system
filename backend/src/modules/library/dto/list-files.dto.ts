import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class ListFilesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  grade?: string;
}
