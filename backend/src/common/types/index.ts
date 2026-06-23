import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../enums';

/** Payload đặt vào JWT + gắn vào req.user. */
export type JwtPayload = {
  sub: string; // userId
  role: UserRole;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
};

/** Envelope phân trang (tái dùng từ reference `types`). */
export type Pagination<T> = {
  pages: number;
  pageSize: number;
  total: number;
  current: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  records: T[];
};

export class PaginationMetaDto {
  @ApiProperty({ type: Number }) pages: number;
  @ApiProperty({ type: Number }) pageSize: number;
  @ApiProperty({ type: Number }) total: number;
  @ApiProperty({ type: Number }) current: number;
  @ApiProperty({ type: Boolean }) hasNextPage: boolean;
  @ApiProperty({ type: Boolean }) hasPreviousPage: boolean;
}

export class PaginationDto<T> extends PaginationMetaDto {
  @ApiProperty({ isArray: true })
  records: T[];
}
