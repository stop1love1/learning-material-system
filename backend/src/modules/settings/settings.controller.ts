import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống' })
  getOrCreate() {
    return this.settingsService.getOrCreate();
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
