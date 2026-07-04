import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Settings } from '../../schemas/settings.schema';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Article } from '../../schemas/article.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { RubricGroup } from '../../schemas/rubric/rubric-group.schema';
import { RubricLevel } from '../../schemas/rubric/rubric-level.schema';
import { RubricCriterion } from '../../schemas/rubric/rubric-criterion.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTING_GROUPS = [
  'org',
  'appearance',
  'misc',
  'homepage',
  'seo',
  'pages',
  'academic',
  'security',
  'notifications',
  'integration',
  'data',
] as const;

// Collections included in an admin content backup (export/import). Users, attempts and
// submissions are intentionally excluded — backup nội dung, không kèm dữ liệu cá nhân.
// Rubric criteria/levels/groups live in their own collections, so they must be backed up
// alongside 'rubrics' or a restore loses all criteria/levels.
const BACKUP_COLLECTIONS = [
  'folders',
  'files',
  'articles',
  'topics',
  'rubrics',
  'rubric-groups',
  'rubric-levels',
  'rubric-criterions',
] as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
    @InjectModel(Rubric.name) private readonly rubricModel: Model<Rubric>,
    @InjectModel(RubricGroup.name) private readonly rubricGroupModel: Model<RubricGroup>,
    @InjectModel(RubricLevel.name) private readonly rubricLevelModel: Model<RubricLevel>,
    @InjectModel(RubricCriterion.name) private readonly rubricCriterionModel: Model<RubricCriterion>,
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
      case 'rubric-groups':
        return this.rubricGroupModel;
      case 'rubric-levels':
        return this.rubricLevelModel;
      case 'rubric-criterions':
        return this.rubricCriterionModel;
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
    // TODO(follow-up): GET /settings is @Public() and JwtAuthGuard skips public routes, so
    // the service can't tell an admin from an anonymous caller here. Until the controller
    // (settings.controller.ts) + guard support optional auth and pass the user, this returns
    // the full doc so the admin form keeps working. Anonymous reads should instead go through
    // toPublicView(result) (defined below) to strip smtp/storageProvider/apiKey and the
    // security/data/notifications/academic groups.
    return result;
  }

  /**
   * Public-facing subset of the settings doc. GET /settings is @Public() so anonymous
   * callers must NOT see the smtp/storageProvider/apiKey fields or the security, data,
   * notifications and academic groups — only site-facing config plus the two intentionally
   * public Google client keys (Google Picker/Sign-In run in the browser).
   */
  private toPublicView(doc: any) {
    const integration = doc?.integration || {};
    return {
      org: doc?.org,
      appearance: doc?.appearance,
      homepage: doc?.homepage,
      seo: doc?.seo,
      pages: doc?.pages,
      misc: doc?.misc,
      // academic policy (score scale / pass threshold) is not secret and the grading UI
      // needs scoreScale, so it stays in the public view.
      academic: doc?.academic,
      integration: {
        googleClientId: integration.googleClientId ?? null,
        googleApiKey: integration.googleApiKey ?? null,
        aiGemUrl: integration.aiGemUrl ?? null,
      },
    };
  }

  /** Public (unauthenticated / non-admin) view — strips admin-only groups + secrets. */
  async getPublicView() {
    return this.toPublicView(await this.getOrCreate());
  }

  async update(dto: UpdateSettingsDto) {
    const flattened: Record<string, any> = {};
    for (const group of SETTING_GROUPS) {
      const value = (dto as any)[group];
      if (value && typeof value === 'object') {
        for (const [field, fieldValue] of Object.entries(value)) {
          // Defense-in-depth: GET /settings redacts integration.apiKey to null, so a form
          // that reloaded and re-sent the whole integration object would $set null over the
          // real key. Treat a null/empty apiKey as "no change" — the dedicated regenerate
          // path saves a real key on its own.
          if (group === 'integration' && field === 'apiKey' && (fieldValue == null || fieldValue === '')) {
            continue;
          }
          flattened[`${group}.${field}`] = fieldValue;
        }
      }
    }
    return this.settingsModel
      .findOneAndUpdate({ key: 'system' }, { $set: flattened }, { returnDocument: 'after', upsert: true })
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
