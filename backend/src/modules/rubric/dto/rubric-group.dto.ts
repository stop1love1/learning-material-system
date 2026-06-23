import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RubricGroupDto {
  @ApiProperty({ example: 'Nhóm rubric' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
