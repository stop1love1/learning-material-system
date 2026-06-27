import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExerciseFoldersService } from './exercise-folders.service';
import { CreateExerciseFolderDto } from './dto/create-exercise-folder.dto';
import { UpdateExerciseFolderDto } from './dto/update-exercise-folder.dto';
import { ListExerciseFoldersDto } from './dto/list-exercise-folders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../enums';

@ApiTags('exercise - folders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercise-folders')
export class ExerciseFoldersController {
  constructor(private readonly foldersService: ExerciseFoldersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách thư mục bài tập/đề thi theo parentId (null = gốc)' })
  list(@Query() dto: ListExerciseFoldersDto) {
    return this.foldersService.list(dto);
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo thư mục' })
  create(@Body() dto: CreateExerciseFolderDto, @CurrentUser('sub') userId: string) {
    return this.foldersService.create(dto, userId);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật thư mục' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseFolderDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.foldersService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa thư mục (chặn nếu còn thư mục con hoặc bài tập)' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.foldersService.remove(id, userId, role);
  }
}
