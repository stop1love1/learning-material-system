import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

// Class-level guards keep every route authed; @Roles is applied PER-METHOD so the
// derived feed stays Admin-only while the personal endpoints (/me, read,
// read-all) are open to any authenticated user.
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Bảng tin hoạt động (tổng hợp từ sự kiện gần đây) — Admin' })
  feed(@Query('limit') limit?: string) {
    const n = Math.min(50, Math.max(1, Number(limit) || 20));
    return this.notificationsService.feed(n);
  }

  @Get('me')
  @ApiOperation({ summary: 'Thông báo cá nhân của tôi (mới nhất trước)' })
  me(@CurrentUser('sub') userId: string, @Query('limit') limit?: string) {
    const n = Math.min(50, Math.max(1, Number(limit) || 20));
    return this.notificationsService.listForUser(userId, n);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  markAllRead(@CurrentUser('sub') userId: string, @Body() _body?: unknown) {
    return this.notificationsService.markAllRead(userId);
  }
}
