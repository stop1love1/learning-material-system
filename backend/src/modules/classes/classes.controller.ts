import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách lớp học (Teacher→của mình · Admin→tất cả · Student→đang ghi danh)' })
  list(@Query() dto: ListClassesDto, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.classesService.list(dto, userId, role);
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo lớp học' })
  create(@Body() dto: CreateClassDto, @CurrentUser('sub') userId: string) {
    return this.classesService.create(dto, userId);
  }

  @Post('join')
  @ApiOperation({ summary: 'Học viên tự tham gia lớp bằng mã' })
  join(@Body() dto: JoinClassDto, @CurrentUser('sub') userId: string) {
    return this.classesService.join(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết lớp học (owner/Admin/học viên đang ghi danh)' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.classesService.findById(id, userId, role);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật lớp học (owner/Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.classesService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa lớp học (cascade ghi danh + gỡ classId bài tập)' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.classesService.remove(id, userId, role);
  }

  @Get(':id/students')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Danh sách học viên trong lớp (owner/Admin)' })
  listStudents(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.classesService.listStudents(id, userId, role);
  }

  @Post(':id/students')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Thêm học viên vào lớp (idempotent)' })
  addStudents(
    @Param('id') id: string,
    @Body() dto: AddStudentsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.classesService.addStudents(id, dto, userId, role);
  }

  @Delete(':id/students/:studentId')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Gỡ học viên khỏi lớp (đặt trạng thái Removed)' })
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.classesService.removeStudent(id, studentId, userId, role);
  }
}
