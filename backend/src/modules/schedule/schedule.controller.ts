import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([UserRole.Teacher, UserRole.Admin])
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('today')
  @ApiOperation({ summary: 'Lịch dạy hôm nay của giáo viên hiện tại' })
  today(@CurrentUser('sub') userId: string) {
    return this.scheduleService.today(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Toàn bộ lịch dạy của giáo viên hiện tại' })
  list(@CurrentUser('sub') userId: string) {
    return this.scheduleService.listMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo buổi học trong lịch' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật buổi học' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.scheduleService.update(id, dto, userId, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa buổi học' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    return this.scheduleService.remove(id, userId, role);
  }
}
