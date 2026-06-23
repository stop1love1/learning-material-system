import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'a@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'matkhau123' })
  @IsString()
  password: string;
}
