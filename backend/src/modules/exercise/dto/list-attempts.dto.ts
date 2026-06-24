import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

/** Lọc danh sách lượt làm cần chấm cho giáo viên/quản trị. */
export class ListAttemptsDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ type: String, description: 'Lọc theo bài tập' })
  exerciseId?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ type: String, description: 'Lọc theo học viên' })
  studentId?: string;

  @IsOptional()
  @IsBooleanString()
  @ApiPropertyOptional({ type: String, description: '"true" = chỉ lượt đang chờ chấm' })
  pendingOnly?: string;
}
