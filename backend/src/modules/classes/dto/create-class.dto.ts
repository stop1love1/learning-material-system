import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'Lớp 5A' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String, example: '5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ type: String, description: 'Mã tham gia lớp (duy nhất)' })
  @IsOptional()
  @IsString()
  code?: string;
}
