import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3d4...' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'matkhaumoi123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
