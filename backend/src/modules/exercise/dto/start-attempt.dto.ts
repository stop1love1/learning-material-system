import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({ type: String })
  @IsString()
  exerciseId: string;
}
