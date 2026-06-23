import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SelfAssessmentService } from './self-assessment.service';
import { CreateSelfAssessmentDto } from './dto/create-self-assessment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('exercise - self-assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('self-assessments')
export class SelfAssessmentController {
  constructor(private readonly selfAssessmentService: SelfAssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài tự đánh giá' })
  create(@Body() dto: CreateSelfAssessmentDto, @CurrentUser('sub') userId: string) {
    return this.selfAssessmentService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bài tự đánh giá của tôi' })
  listOwn(@CurrentUser('sub') userId: string) {
    return this.selfAssessmentService.listOwn(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bài tự đánh giá' })
  findOne(@Param('id') id: string) {
    return this.selfAssessmentService.findOne(id);
  }
}
