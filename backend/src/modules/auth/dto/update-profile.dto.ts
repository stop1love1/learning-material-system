import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/** Người dùng tự cập nhật hồ sơ của chính mình. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  avatar?: string;
}
