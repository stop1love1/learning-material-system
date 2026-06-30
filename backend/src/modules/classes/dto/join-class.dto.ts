import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JoinClassDto {
  @ApiProperty({ type: String, description: 'Mã tham gia lớp' })
  @IsString()
  @MinLength(1)
  code: string;
}
