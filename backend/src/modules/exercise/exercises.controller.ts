import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { JwtService } from '../../global/jwt.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ListExercisesDto } from './dto/list-exercises.dto';
import { AddExerciseQuestionDto } from './dto/add-exercise-question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../enums';

@ApiTags('exercise')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(
    private readonly exercisesService: ExercisesService,
    private readonly jwtService: JwtService,
  ) {}

  // @Public bỏ qua JwtAuthGuard nên req.user luôn undefined. Tự giải mã token (nếu có)
  // để chủ sở hữu / Admin vẫn thấy đáp án (cần để sửa bài); token hỏng / thiếu → khách,
  // và service sẽ lược bỏ đáp án đúng trước khi trả về (chống xem trộm đáp án).
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
  @ApiOperation({ summary: 'Danh sách bài tập (phân trang, lọc type/subject/grade/status)' })
  list(@Query() dto: ListExercisesDto, @Headers('authorization') authorization?: string) {
    return this.exercisesService.list(dto, this.resolveViewer(authorization));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết bài tập kèm danh sách câu hỏi' })
  findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.exercisesService.findOne(id, this.resolveViewer(authorization), true);
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo bài tập' })
  create(@Body() dto: CreateExerciseDto, @CurrentUser('sub') userId: string) {
    return this.exercisesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật bài tập' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.exercisesService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa bài tập (gỡ luôn các câu hỏi liên kết)' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.exercisesService.remove(id, userId, role);
  }

  @Post(':id/questions')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Thêm câu hỏi vào bài tập' })
  addQuestion(
    @Param('id') id: string,
    @Body() dto: AddExerciseQuestionDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.exercisesService.addQuestion(id, dto, userId, role);
  }

  @Delete(':id/questions/:questionId')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Gỡ câu hỏi khỏi bài tập' })
  removeQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.exercisesService.removeQuestion(id, questionId, userId, role);
  }
}
