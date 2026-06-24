import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from '../../schemas/schedule.schema';
import { convertStringToObjectId } from '../../common/utils';
import { UserRole } from '../../enums';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>) {}

  /** Toàn bộ lịch của giáo viên hiện tại, sắp theo thứ rồi giờ. */
  async listMine(userId: string) {
    return this.scheduleModel
      .find({ userId: convertStringToObjectId(userId) })
      .sort({ dayOfWeek: 1, time: 1 })
      .lean();
  }

  /** Lịch hôm nay của giáo viên hiện tại (theo thứ trong tuần của server). */
  async today(userId: string) {
    const dow = new Date().getDay(); // 0=CN..6=Thứ 7
    return this.scheduleModel
      .find({ userId: convertStringToObjectId(userId), dayOfWeek: dow })
      .sort({ time: 1 })
      .lean();
  }

  async create(userId: string, dto: CreateScheduleDto) {
    const doc = await this.scheduleModel.create({ ...dto, userId: convertStringToObjectId(userId) });
    const created = await this.scheduleModel.findById(doc._id).lean();
    if (!created) throw new NotFoundException('Không tìm thấy lịch dạy');
    return created;
  }

  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateScheduleDto, userId: string, role?: UserRole) {
    const doc = await this.scheduleModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), { ...dto }, { new: true })
      .lean();
    if (!doc) throw new NotFoundException('Không tìm thấy lịch dạy');
    return doc;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const res = await this.scheduleModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy lịch dạy');
    return { deleted: true };
  }
}
