import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { JwtService } from '../../global/jwt.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ListFoldersDto } from './dto/list-folders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../enums';

@ApiTags('library - folders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('folders')
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly jwtService: JwtService,
  ) {}

  // @Public bỏ qua JwtAuthGuard nên req.user luôn undefined. Tự giải mã token (nếu có)
  // để chủ sở hữu đã đăng nhập vẫn thấy nội dung riêng tư của mình; token hỏng → khách.
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
  @ApiOperation({ summary: 'Danh sách thư mục theo parentId (null = thư mục gốc)' })
  list(@Query() dto: ListFoldersDto, @Headers('authorization') authorization?: string) {
    return this.foldersService.list(dto, this.resolveViewer(authorization));
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo thư mục' })
  create(@Body() dto: CreateFolderDto, @CurrentUser('sub') userId: string) {
    return this.foldersService.create(dto, userId);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật thư mục' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.foldersService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa thư mục' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.foldersService.remove(id, userId, role);
  }
}
