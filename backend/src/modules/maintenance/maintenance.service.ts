import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { mkdir, writeFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { MailService } from '../../global/mail.service';
import { UserRole } from '../../enums';
import { Settings } from '../../schemas/settings.schema';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Article } from '../../schemas/article.schema';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { RubricGroup } from '../../schemas/rubric/rubric-group.schema';
import { RubricLevel } from '../../schemas/rubric/rubric-level.schema';
import { RubricCriterion } from '../../schemas/rubric/rubric-criterion.schema';
import { User } from '../../schemas/user.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Submission } from '../../schemas/exercise/submission.schema';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  private static readonly MAX_BACKUPS = 14;
  private static readonly BACKUP_DIR = join(process.cwd(), 'backups');

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
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
    private readonly mail: MailService,
  ) {}

  private async getSettings(): Promise<any | null> {
    try {
      return await this.settingsModel.findOne({ key: 'system' }).lean();
    } catch (err) {
      this.logger.error(`Không đọc được cấu hình hệ thống: ${(err as Error)?.message ?? err}`);
      return null;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoBackup(): Promise<void> {
    try {
      const settings = await this.getSettings();
      const data = settings?.data;
      if (!data?.autoBackup) return;

      const frequency = data.backupFrequency || 'weekly';
      const now = new Date();
      if (frequency === 'weekly' && now.getDay() !== 1) return;
      if (frequency === 'monthly' && now.getDate() !== 1) return;

      const collections: Record<string, any[]> = {
        folders: await this.folderModel.find().lean(),
        files: await this.fileModel.find().lean(),
        articles: await this.articleModel.find().lean(),
        topics: await this.topicModel.find().lean(),
        rubrics: await this.rubricModel.find().lean(),
        // Rubric criteria/levels/groups live in their own collections — back them up too.
        'rubric-groups': await this.rubricGroupModel.find().lean(),
        'rubric-levels': await this.rubricLevelModel.find().lean(),
        'rubric-criterions': await this.rubricCriterionModel.find().lean(),
      };
      const snapshot = {
        version: 1,
        exportedAt: now.toISOString(),
        collections,
      };

      await mkdir(MaintenanceService.BACKUP_DIR, { recursive: true });
      const stamp = this.timestamp(now);
      const filePath = join(MaintenanceService.BACKUP_DIR, `backup-${stamp}.json`);
      await writeFile(filePath, JSON.stringify(snapshot), 'utf8');
      this.logger.log(`Đã tạo bản sao lưu tự động: ${filePath}`);

      await this.pruneOldBackups();
    } catch (err) {
      this.logger.error(`Sao lưu tự động thất bại: ${(err as Error)?.message ?? err}`);
    }
  }

  private timestamp(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
      `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    );
  }

  private async pruneOldBackups(): Promise<void> {
    try {
      const entries = await readdir(MaintenanceService.BACKUP_DIR);
      const backups = entries
        .filter((name) => name.startsWith('backup-') && name.endsWith('.json'))
        .sort();
      const stale = backups.slice(0, Math.max(0, backups.length - MaintenanceService.MAX_BACKUPS));
      for (const name of stale) {
        try {
          await unlink(join(MaintenanceService.BACKUP_DIR, name));
        } catch {
        }
      }
    } catch (err) {
      this.logger.warn(`Không dọn được bản sao lưu cũ: ${(err as Error)?.message ?? err}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async remindUngraded(): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings?.notifications?.remindUngraded) return;

      const ungraded = await this.submissionModel.find({ isGraded: false }).lean();
      if (!ungraded.length) return;

      const attemptIds = ungraded.map((s) => s.attemptId).filter(Boolean);
      const attempts = await this.attemptModel
        .find({ _id: { $in: attemptIds } })
        .select('exerciseId')
        .lean();
      const attemptToExercise = new Map<string, string>();
      for (const a of attempts) {
        if (a.exerciseId) attemptToExercise.set(String(a._id), String(a.exerciseId));
      }

      const exerciseIds = [...new Set([...attemptToExercise.values()])];
      const exercises = await this.exerciseModel
        .find({ _id: { $in: exerciseIds.map((id) => new Types.ObjectId(id)) } })
        .select('userId')
        .lean();
      const exerciseToOwner = new Map<string, string>();
      for (const ex of exercises) {
        if (ex.userId) exerciseToOwner.set(String(ex._id), String(ex.userId));
      }

      const pendingByOwner = new Map<string, number>();
      for (const sub of ungraded) {
        const exId = attemptToExercise.get(String(sub.attemptId));
        if (!exId) continue;
        const ownerId = exerciseToOwner.get(exId);
        if (!ownerId) continue;
        pendingByOwner.set(ownerId, (pendingByOwner.get(ownerId) ?? 0) + 1);
      }
      if (!pendingByOwner.size) return;

      const owners = await this.userModel
        .find({ _id: { $in: [...pendingByOwner.keys()].map((id) => new Types.ObjectId(id)) } })
        .select('email name')
        .lean();

      for (const owner of owners) {
        if (!owner.email) continue;
        const count = pendingByOwner.get(String(owner._id)) ?? 0;
        if (count <= 0) continue;
        try {
          const html = `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
              <h2 style="color:#0f766e">Bài tập chờ chấm</h2>
              <p>Xin chào ${owner.name ?? ''},</p>
              <p>Bạn có <strong>${count}</strong> bài chưa chấm. Vui lòng đăng nhập để chấm điểm.</p>
            </div>`;
          await this.mail.sendMail(owner.email, `Bạn có ${count} bài chưa chấm`, html);
        } catch (err) {
          this.logger.error(
            `Gửi nhắc chấm bài tới ${owner.email} thất bại: ${(err as Error)?.message ?? err}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Nhắc chấm bài thất bại: ${(err as Error)?.message ?? err}`);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyDigest(): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings?.notifications?.weeklyDigest) return;

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [newSubmissions, newUsers, newExercises] = await Promise.all([
        this.submissionModel.countDocuments({ createdAt: { $gte: since } }),
        this.userModel.countDocuments({ createdAt: { $gte: since } }),
        this.exerciseModel.countDocuments({ createdAt: { $gte: since } }),
      ]);

      const admins = await this.userModel
        .find({ role: UserRole.Admin })
        .select('email name')
        .lean();
      if (!admins.length) return;

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
          <h2 style="color:#0f766e">Tổng kết tuần — Vườn Văn</h2>
          <p>Số liệu 7 ngày qua:</p>
          <ul>
            <li>Bài nộp mới: <strong>${newSubmissions}</strong></li>
            <li>Người dùng mới: <strong>${newUsers}</strong></li>
            <li>Bài tập mới: <strong>${newExercises}</strong></li>
          </ul>
        </div>`;

      for (const admin of admins) {
        if (!admin.email) continue;
        try {
          await this.mail.sendMail(admin.email, 'Tổng kết tuần — Vườn Văn', html);
        } catch (err) {
          this.logger.error(
            `Gửi tổng kết tuần tới ${admin.email} thất bại: ${(err as Error)?.message ?? err}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Tổng kết tuần thất bại: ${(err as Error)?.message ?? err}`);
    }
  }
}
