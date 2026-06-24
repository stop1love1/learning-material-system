import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { Article } from '../../schemas/article.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { User } from '../../schemas/user.schema';
import { Submission } from '../../schemas/exercise/submission.schema';

type Feed = { id: string; title: string; time: string; at: string; tag: string; icon: string };

/** Khoảng thời gian tương đối kiểu "15 phút trước", "Hôm qua". */
function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Hôm qua';
  if (d < 7) return `${d} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
  ) {}

  /** Bảng tin hoạt động — tổng hợp từ các sự kiện gần đây trong hệ thống. */
  async feed(limit = 20): Promise<Feed[]> {
    const [exercises, articles, files, users, ungraded] = await Promise.all([
      this.exerciseModel.find({}).sort({ createdAt: -1 }).limit(8).select('title createdAt').lean(),
      this.articleModel.find({}).sort({ createdAt: -1 }).limit(8).select('title createdAt').lean(),
      this.fileModel.find({}).sort({ createdAt: -1 }).limit(8).select('name createdAt').lean(),
      this.userModel.find({}).sort({ createdAt: -1 }).limit(6).select('name createdAt').lean(),
      this.submissionModel.countDocuments({ isGraded: false }),
    ]);

    const items: Feed[] = [];
    const push = (doc: any, title: string, tag: string, icon: string) => {
      const at: Date = doc.createdAt || new Date();
      items.push({ id: String(doc._id), title, time: relativeTime(at), at: at.toISOString(), tag, icon });
    };

    exercises.forEach((e: any) => push(e, `Bài tập mới: ${e.title}`, 'Bài tập', 'assign'));
    articles.forEach((a: any) => push(a, `Bài viết mới: ${a.title}`, 'Bài viết', 'edit'));
    files.forEach((f: any) => push(f, `Tài liệu mới: ${f.name}`, 'Học liệu', 'docs'));
    users.forEach((u: any) => push(u, `Thành viên mới: ${u.name}`, 'Người dùng', 'users'));

    items.sort((a, b) => b.at.localeCompare(a.at));

    // Tổng hợp "chờ chấm" luôn đặt lên đầu nếu có.
    if (ungraded > 0) {
      const now = new Date();
      items.unshift({
        id: 'grading-pending',
        title: `${ungraded} bài đang chờ chấm`,
        time: 'Cần xử lý',
        at: now.toISOString(),
        tag: 'Chấm điểm',
        icon: 'grade',
      });
    }

    return items.slice(0, limit);
  }
}
