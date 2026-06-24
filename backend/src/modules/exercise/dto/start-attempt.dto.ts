import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  exerciseId: string;
}
