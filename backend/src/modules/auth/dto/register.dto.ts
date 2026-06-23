import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
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
}
