import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtService } from '../../global/jwt.service';
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
  constructor(
    private readonly filesService: FilesService,
    private readonly jwtService: JwtService,
  ) {}

  // @Public bỏ qua JwtAuthGuard nên req.user luôn undefined. Tự giải mã token (nếu có)
  // để chủ sở hữu đã đăng nhập vẫn thấy tài liệu riêng tư của mình; token hỏng → khách.
  private resolveViewer(authorization?: string): { userId?: string; role?: UserRole } | undefined {
    if (!authorization) return undefined;
    try {
      const payload = this.jwtService.verify(authorization);
      return { userId: payload.sub, role: payload.role };
    } catch {
      return undefined;
    }
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách tài liệu (phân trang, lọc folder/subject/grade)' })
  list(@Query() dto: ListFilesDto, @Headers('authorization') authorization?: string) {
    return this.filesService.list(dto, this.resolveViewer(authorization));
  }

  @Get('me/downloads')
  @ApiOperation({ summary: 'Tài liệu của tôi (đã tải)' })
  myDownloads(@CurrentUser('sub') userId: string) {
    return this.filesService.myDownloads(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết tài liệu (tăng lượt xem)' })
  findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.filesService.findOne(id, this.resolveViewer(authorization));
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.filesService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa tài liệu' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.filesService.remove(id, userId, role);
  }

  @Post(':id/download')
  @ApiOperation({ summary: 'Ghi nhận tải tài liệu' })
  download(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.filesService.download(id, { userId, role });
  }
}
