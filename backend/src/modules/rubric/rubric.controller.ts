import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RubricService } from './rubric.service';
import { ListRubricsDto, RubricDto } from './dto/rubric.dto';
import { RubricGroupDto } from './dto/rubric-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('rubric')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('')
export class RubricController {
  constructor(private readonly rubricService: RubricService) {}

  @Get('rubrics')
  @Public()
  @ApiOperation({ summary: 'Danh sách rubric (public — dùng cho chấm bài & tự đánh giá)' })
  listRubrics(@CurrentUser('sub') userId: string, @Query() dto: ListRubricsDto) {
    return this.rubricService.listRubrics(userId, dto);
  }

  @Get('rubrics/:id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết rubric kèm mức điểm và tiêu chí' })
  getRubric(@Param('id') id: string) {
    return this.rubricService.getRubric(id);
  }

  @Post('rubrics')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo rubric (kèm mức điểm và tiêu chí)' })
  createRubric(@CurrentUser('sub') userId: string, @Body() dto: RubricDto) {
    return this.rubricService.createRubric(userId, dto);
  }

  @Patch('rubrics/:id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật rubric (đối soát mức điểm và tiêu chí)' })
  updateRubric(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RubricDto) {
    return this.rubricService.updateRubric(userId, id, dto);
  }

  @Delete('rubrics/:id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa rubric (kèm mức điểm và tiêu chí)' })
  deleteRubric(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rubricService.deleteRubric(userId, id);
  }

  @Get('rubric-groups')
  @ApiOperation({ summary: 'Danh sách nhóm rubric của tôi (kèm số lượng rubric)' })
  listRubricGroups(@CurrentUser('sub') userId: string) {
    return this.rubricService.listRubricGroups(userId);
  }

  @Post('rubric-groups')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Tạo nhóm rubric' })
  createRubricGroup(@CurrentUser('sub') userId: string, @Body() dto: RubricGroupDto) {
    return this.rubricService.createRubricGroup(userId, dto);
  }

  @Patch('rubric-groups/:id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật nhóm rubric' })
  updateRubricGroup(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: RubricGroupDto) {
    return this.rubricService.updateRubricGroup(userId, id, dto);
  }

  @Delete('rubric-groups/:id')
  @Roles([UserRole.Teacher, UserRole.Admin])
  @ApiOperation({ summary: 'Xóa nhóm rubric (gỡ rubric khỏi nhóm)' })
  deleteRubricGroup(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.rubricService.deleteRubricGroup(userId, id);
  }
}
