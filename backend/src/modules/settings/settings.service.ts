import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from '../../schemas/settings.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
  ) {}

  /** Lấy cấu hình hệ thống (singleton); tạo bản mặc định nếu chưa có. */
  async getOrCreate() {
    const existing = await this.settingsModel.findOne({ key: 'system' }).lean();
    if (existing) return existing;
    const created = await this.settingsModel.create({ key: 'system' });
    return this.settingsModel.findById(created._id).lean();
  }

  /** Cập nhật cấu hình (upsert). Làm phẳng các object con để $set theo đúng nhánh. */
  async update(dto: UpdateSettingsDto) {
    const flattened: Record<string, any> = {};
    for (const group of ['org', 'appearance', 'misc'] as const) {
      const value = dto[group];
      if (value && typeof value === 'object') {
        for (const [field, fieldValue] of Object.entries(value)) {
          flattened[`${group}.${field}`] = fieldValue;
        }
      }
    }
    return this.settingsModel
      .findOneAndUpdate({ key: 'system' }, { $set: flattened }, { new: true, upsert: true })
      .lean();
  }
}
