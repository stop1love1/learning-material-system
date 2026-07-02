import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtService } from '../../global/jwt.service';
import { UserRole } from '../../enums';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống' })
  getOrCreate(@Req() req: any) {
    // @Public route: JwtAuthGuard skips it and never sets req.user, so soft-decode the
    // optional Bearer here. Admins get the full doc (the settings screen needs it);
    // everyone else (teacher / anonymous) gets the stripped public view.
    return this.isAdmin(req)
      ? this.settingsService.getOrCreate()
      : this.settingsService.getPublicView();
  }

  private isAdmin(req: any): boolean {
    const header = req?.headers?.authorization as string | undefined;
    if (!header) return false;
    try {
      const payload = this.jwtService.verify(header);
      return payload?.role === UserRole.Admin;
    } catch {
      return false;
    }
  }

  @Patch()
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống' })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }

  @Get('export')
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Xuất bản sao lưu nội dung (JSON)' })
  exportBackup() {
    return this.settingsService.exportBackup();
  }

  @Post('import')
  @Roles([UserRole.Admin])
  @ApiOperation({ summary: 'Khôi phục nội dung từ bản sao lưu' })
  importBackup(@Body('snapshot') snapshot: any) {
    return this.settingsService.importBackup(snapshot);
  }
}
