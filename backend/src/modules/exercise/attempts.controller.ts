import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('exercise - attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu một lượt làm bài tập' })
  start(@Body() dto: StartAttemptDto, @CurrentUser('sub') userId: string) {
    return this.attemptsService.start(dto, userId);
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
}
