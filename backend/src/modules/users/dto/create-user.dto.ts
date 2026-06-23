import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../../enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'a@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'matkhau123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.Student })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.Active })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
