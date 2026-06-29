import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ExerciseStatus, ExerciseType } from '../../../enums';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bài tập đọc hiểu tuần 1' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  type: ExerciseType;

  @ApiPropertyOptional({ enum: ExerciseStatus, default: ExerciseStatus.Open })
  @IsOptional()
  @IsEnum(ExerciseStatus)
  status?: ExerciseStatus;

  @ApiPropertyOptional({ type: String, default: 'Tiếng Việt' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: String, example: 'Lớp 5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ type: Number, default: 0, description: 'phút · 0 = không giới hạn' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  showAnswer?: boolean;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Rubric gắn cho bài tập' })
  @IsOptional()
  @IsMongoId()
  rubricId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Hướng dẫn / mô tả chi tiết cho học viên' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ type: String, example: 'Lớp 5A', description: 'Phạm vi giao bài (nhãn lớp/nhóm)' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ type: Boolean, default: false, description: 'Cho phép nộp muộn' })
  @IsOptional()
  @IsBoolean()
  allowLateSubmit?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: true, description: 'Hiển thị điểm sau khi nộp' })
  @IsOptional()
  @IsBoolean()
  showScoreAfter?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: false, description: 'Gửi thông báo khi giao bài' })
  @IsOptional()
  @IsBoolean()
  notifyOnAssign?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialIds?: string[];

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Thư mục chứa bài tập (folderId). null = không thuộc thư mục.' })
  @IsOptional()
  @IsString()
  folderId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Lớp được giao bài (classId). null/bỏ trống = công khai.' })
  @IsOptional()
  @IsMongoId()
  classId?: string | null;
}
