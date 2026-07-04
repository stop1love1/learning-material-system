import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([UserRole.Admin])
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Số liệu tổng quan dashboard (đếm thật + xu hướng + lượt làm bài)' })
  overview() {
    return this.statsService.overview();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Báo cáo & thống kê (phân bố điểm, tỷ lệ chấm, điểm TB, theo bài tập)' })
  reports() {
    return this.statsService.reports();
  }
}
