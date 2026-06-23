import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { UserRole, UserStatus } from '../../../enums';

export class ListUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({ enum: UserRole })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  @ApiPropertyOptional({ enum: UserStatus })
  status?: UserStatus;
}
