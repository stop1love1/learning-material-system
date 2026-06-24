import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { FileSource, FileType } from '../../../enums';

export class CreateFileDto {
  @ApiProperty({ example: 'Giáo án Tập đọc - Tuần 1' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: FileType })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiPropertyOptional({ enum: FileSource, default: FileSource.External })
  @IsOptional()
  @IsEnum(FileSource)
  source?: FileSource;

  @ApiPropertyOptional({ type: String, example: 'https://drive.google.com/file/d/.../view' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsMongoId()
  folderId?: string;

  @ApiPropertyOptional({ type: String, example: 'Tiếng Việt' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ type: String, example: 'Lớp 5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
