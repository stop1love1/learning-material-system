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

  async getOrCreate() {
    let doc = await this.settingsModel.findOne({ key: 'system' });
    if (!doc) doc = await this.settingsModel.create({ key: 'system' });
    // Backfill: doc cũ có thể thiếu nhóm được thêm sau (default chỉ áp dụng lúc tạo).
    const defaults: any = new this.settingsModel({ key: 'system' }).toObject();
    let changed = false;
    for (const group of ['org', 'appearance', 'misc', 'homepage', 'seo'] as const) {
      if ((doc as any)[group] == null) {
        (doc as any)[group] = defaults[group];
        changed = true;
      }
    }
    if (changed) await doc.save();
    return doc.toObject();
  }

  async update(dto: UpdateSettingsDto) {
    const flattened: Record<string, any> = {};
    for (const group of ['org', 'appearance', 'misc', 'homepage', 'seo'] as const) {
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
