import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { ListAttemptsDto } from './dto/list-attempts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('exercise - attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Danh sách lượt làm cần chấm (lọc exerciseId/studentId/pendingOnly)' })
  list(
    @Query() dto: ListAttemptsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.attemptsService.listForGrading(dto, userId, role);
  }

  @Get('me')
  @ApiOperation({ summary: 'Các lượt làm của tôi (học viên) — trạng thái + điểm' })
  mine(@CurrentUser('sub') userId: string) {
    return this.attemptsService.listMine(userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu một lượt làm bài tập' })
  start(@Body() dto: StartAttemptDto, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.attemptsService.start(dto, userId, role);
  }

  @Post(':attemptId/submit')
  @ApiOperation({ summary: 'Nộp bài cho một lượt làm' })
  submit(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.attemptsService.submit(attemptId, dto, userId);
  }

  @Get(':attemptId/result')
  @ApiOperation({ summary: 'Kết quả một lượt làm (submission + đáp án)' })
  result(@Param('attemptId') attemptId: string, @CurrentUser('sub') userId: string) {
    return this.attemptsService.result(attemptId, userId);
  }

  @Patch(':attemptId/grade')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Chấm điểm một lượt làm (điểm/nhận xét từng câu + tổng)' })
  grade(
    @Param('attemptId') attemptId: string,
    @Body() dto: GradeAttemptDto,
    @CurrentUser('sub') graderId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.attemptsService.grade(attemptId, dto, graderId, role);
  }
}
