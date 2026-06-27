import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateParticipantDto {
  @ApiPropertyOptional({ type: Boolean, description: 'Cấm/bỏ cấm thí sinh' })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Đánh dấu đã hoàn thành' })
  @IsOptional()
  @IsBoolean()
  isFinished?: boolean;
}
