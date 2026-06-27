import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class ListParticipantsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Lọc theo bài tập (exerciseId)' })
  @IsOptional()
  @IsMongoId()
  exerciseId?: string;
}
