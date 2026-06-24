import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
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
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách bài tập (phân trang, lọc type/subject/grade/status)' })
  list(@Query() dto: ListExercisesDto) {
    return this.exercisesService.list(dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết bài tập kèm danh sách câu hỏi' })
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
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
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercisesService.update(id, dto);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa bài tập (gỡ luôn các câu hỏi liên kết)' })
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }

  @Post(':id/questions')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Thêm câu hỏi vào bài tập' })
  addQuestion(@Param('id') id: string, @Body() dto: AddExerciseQuestionDto) {
    return this.exercisesService.addQuestion(id, dto);
  }

  @Delete(':id/questions/:questionId')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Gỡ câu hỏi khỏi bài tập' })
  removeQuestion(@Param('id') id: string, @Param('questionId') questionId: string) {
    return this.exercisesService.removeQuestion(id, questionId);
  }
}
