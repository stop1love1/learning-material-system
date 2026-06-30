import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { ListParticipantsDto } from './dto/list-participants.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('exercise - participants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([UserRole.Teacher, UserRole.Admin])
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thí sinh tham gia (phân trang, lọc theo exerciseId)' })
  list(
    @Query() dto: ListParticipantsDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.participantsService.list(dto, userId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thí sinh tham gia' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.participantsService.findOne(id, userId, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thí sinh (cấm/bỏ cấm, đánh dấu hoàn thành)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateParticipantDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.participantsService.update(id, dto, userId, role);
  }
}
