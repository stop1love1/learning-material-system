import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings } from '../../schemas/settings.schema';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Article } from '../../schemas/article.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTING_GROUPS = [
  'org',
  'appearance',
  'misc',
  'homepage',
  'seo',
  'academic',
  'security',
  'notifications',
  'integration',
  'data',
] as const;

// Collections included in an admin content backup (export/import). Users, attempts and
// submissions are intentionally excluded — backup nội dung, không kèm dữ liệu cá nhân.
const BACKUP_COLLECTIONS = ['folders', 'files', 'articles', 'topics', 'rubrics'] as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
    @InjectModel(Rubric.name) private readonly rubricModel: Model<Rubric>,
  ) {}

  private backupModel(key: (typeof BACKUP_COLLECTIONS)[number]): Model<any> {
    switch (key) {
      case 'folders':
        return this.folderModel;
      case 'files':
        return this.fileModel;
      case 'articles':
        return this.articleModel;
      case 'topics':
        return this.topicModel;
      case 'rubrics':
        return this.rubricModel;
    }
  }

  async getOrCreate() {
    let doc = await this.settingsModel.findOne({ key: 'system' });
    if (!doc) doc = await this.settingsModel.create({ key: 'system' });
    // Backfill: doc cũ có thể thiếu nhóm được thêm sau (default chỉ áp dụng lúc tạo).
    const defaults: any = new this.settingsModel({ key: 'system' }).toObject();
    let changed = false;
    for (const group of SETTING_GROUPS) {
      if ((doc as any)[group] == null) {
        (doc as any)[group] = defaults[group];
        changed = true;
      }
    }
    if (changed) await doc.save();
    const result = doc.toObject() as any;
    // GET /settings is @Public() — redact the integration secret from the returned copy
    // (do NOT touch the stored doc). The admin UI regenerates the key by writing a new one.
    if (result.integration) {
      result.integration.apiKey = null;
    }
    return result;
  }

  async update(dto: UpdateSettingsDto) {
    const flattened: Record<string, any> = {};
    for (const group of SETTING_GROUPS) {
      const value = (dto as any)[group];
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

  async exportBackup() {
    const collections: Record<string, any[]> = {};
    for (const key of BACKUP_COLLECTIONS) {
      collections[key] = await this.backupModel(key).find().lean();
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      collections,
    };
  }

  async importBackup(snapshot: any) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.collections) {
      throw new BadRequestException('Tệp sao lưu không hợp lệ');
    }
    const restored: Record<string, number> = {};
    for (const key of BACKUP_COLLECTIONS) {
      const rows = snapshot.collections[key];
      if (!Array.isArray(rows)) continue;
      const model = this.backupModel(key);
      let count = 0;
      for (const row of rows) {
        if (!row || !row._id || !Types.ObjectId.isValid(row._id)) continue;
        const { _id, ...rest } = row;
        await model.updateOne({ _id }, { $set: rest }, { upsert: true });
        count++;
      }
      restored[key] = count;
    }
    return { ok: true as const, restored };
  }
}
