import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Tiếng Việt 5A1 — Tập đọc' })
  @IsString()
  title: string;

  @ApiProperty({ type: Number, example: 1, description: '0=CN … 6=Thứ 7' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '07:15' })
  @IsString()
  time: string;

  @ApiPropertyOptional({ example: '40 phút' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'P.305' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ example: 'TV5A1' })
  @IsOptional()
  @IsString()
  classLabel?: string;
}
