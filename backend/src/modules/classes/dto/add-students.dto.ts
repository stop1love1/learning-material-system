import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class AddStudentsDto {
  @ApiProperty({ type: [String], description: 'Danh sách userId học viên cần thêm vào lớp' })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  studentIds: string[];
}
