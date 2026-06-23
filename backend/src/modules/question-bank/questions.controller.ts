import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('question-bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách câu hỏi của tôi (phân trang, lọc type/level/topic)' })
  list(@CurrentUser('sub') userId: string, @Query() dto: ListQuestionsDto) {
    return this.questionsService.list(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết câu hỏi (gốc + chi tiết theo loại)' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo câu hỏi' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateQuestionDto) {
    return this.questionsService.create(userId, dto);
  }

  @Patch(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật câu hỏi (gốc + chi tiết)' })
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa câu hỏi (gốc + chi tiết)' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
