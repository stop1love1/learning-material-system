import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { ListFilesDto } from './dto/list-files.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../enums';

@ApiTags('library - files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách tài liệu (phân trang, lọc folder/subject/grade)' })
  list(@Query() dto: ListFilesDto) {
    return this.filesService.list(dto);
  }

  @Get('me/downloads')
  @ApiOperation({ summary: 'Tài liệu của tôi (đã tải)' })
  myDownloads(@CurrentUser('sub') userId: string) {
    return this.filesService.myDownloads(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết tài liệu (tăng lượt xem)' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo tài liệu' })
  create(@Body() dto: CreateFileDto, @CurrentUser('sub') userId: string) {
    return this.filesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật tài liệu' })
  update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.filesService.update(id, dto);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa tài liệu' })
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Ghi nhận tải tài liệu' })
  download(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.filesService.download(id, userId);
  }
}
