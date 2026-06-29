import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateClassDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Mã tham gia lớp (duy nhất)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
