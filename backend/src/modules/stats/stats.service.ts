import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { Article } from '../../schemas/article.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Submission } from '../../schemas/exercise/submission.schema';

const DAY_MS = 24 * 60 * 60 * 1000;
const fmtDay = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
  ) {}

  /** Đếm tài liệu tạo trong [from, to). */
  private countIn(model: Model<any>, from: Date, to: Date) {
    return model.countDocuments({ createdAt: { $gte: from, $lt: to } });
  }

  /** % thay đổi kỳ này so với kỳ trước (null nếu kỳ trước = 0). */
  private trendPct(curr: number, prev: number): number | null {
    if (!prev) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  /** Chuỗi số lượt làm bài theo ngày, lấp đủ `days` ngày gần nhất (không bỏ ngày 0). */
  private async attemptsSeries(days: number) {
    const now = new Date();
    const from = new Date(now.getTime() - days * DAY_MS);
    const rows: Array<{ _id: string; count: number }> = await this.attemptModel.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const map = new Map(rows.map((r) => [r._id, r.count]));
    const series: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = fmtDay(new Date(now.getTime() - i * DAY_MS));
      series.push({ date: key, count: map.get(key) || 0 });
    }
    return series;
  }

  /** Dashboard tổng quan — đếm thật + xu hướng 30 ngày + chuỗi lượt làm bài. */
  async overview() {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * DAY_MS);
    const d60 = new Date(now.getTime() - 60 * DAY_MS);

    const [users, files, exercises, articles, questions, attempts, submissions, graded] =
      await Promise.all([
        this.userModel.countDocuments({}),
        this.fileModel.countDocuments({}),
        this.exerciseModel.countDocuments({}),
        this.articleModel.countDocuments({}),
        this.questionModel.countDocuments({}),
        this.attemptModel.countDocuments({}),
        this.submissionModel.countDocuments({}),
        this.submissionModel.countDocuments({ isGraded: true }),
      ]);

    // Xu hướng cho 4 thẻ chính: tạo trong 30 ngày qua vs 30 ngày trước đó.
    const trendFor = async (model: Model<any>) => {
      const [curr, prev] = await Promise.all([this.countIn(model, d30, now), this.countIn(model, d60, d30)]);
      return this.trendPct(curr, prev);
    };
    const [usersTrend, filesTrend, exercisesTrend, articlesTrend] = await Promise.all([
      trendFor(this.userModel),
      trendFor(this.fileModel),
      trendFor(this.exerciseModel),
      trendFor(this.articleModel),
    ]);

    const series = await this.attemptsSeries(30);
    const activityTotal = series.reduce((s, x) => s + x.count, 0);
    const [attemptsCurr, attemptsPrev] = await Promise.all([
      this.countIn(this.attemptModel, d30, now),
      this.countIn(this.attemptModel, d60, d30),
    ]);
    const activityTrend = this.trendPct(attemptsCurr, attemptsPrev);

    // Học liệu nổi bật: theo lượt xem + lượt tải.
    const topFiles = await this.fileModel
      .find({ isActive: { $ne: false } })
      .sort({ viewCount: -1, downloadCount: -1, createdAt: -1 })
      .limit(5)
      .select('name fileType viewCount downloadCount tags')
      .lean();

    return {
      counts: { users, files, exercises, articles, questions, attempts, submissions },
      grading: { graded, ungraded: Math.max(0, submissions - graded) },
      trends: { users: usersTrend, files: filesTrend, exercises: exercisesTrend, articles: articlesTrend },
      activity: { total: activityTotal, trend: activityTrend, series },
      topFiles,
    };
  }

  /** Báo cáo & thống kê — phân bố điểm, tỷ lệ chấm, điểm TB, theo bài tập. */
  async reports() {
    const [distRows, avgRow, totalSub, gradedSub] = await Promise.all([
      this.submissionModel.aggregate([
        { $match: { percent: { $ne: null } } },
        {
          $bucket: {
            groupBy: '$percent',
            boundaries: [0, 50, 65, 80, 90, 101],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      this.submissionModel.aggregate([
        { $match: { totalScore: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$totalScore' }, max: { $max: '$totalScore' } } },
      ]),
      this.submissionModel.countDocuments({}),
      this.submissionModel.countDocuments({ isGraded: true }),
    ]);

    const bucketLabels: Record<string, string> = {
      '0': '0–5 · Cần cố gắng',
      '50': '5–6,5 · Đạt',
      '65': '6,5–8 · Khá',
      '80': '8–9 · Giỏi',
      '90': '9–10 · Xuất sắc',
    };
    const distribution = [0, 50, 65, 80, 90].map((b) => ({
      label: bucketLabels[String(b)],
      count: (distRows.find((r: any) => r._id === b) || {}).count || 0,
    }));

    // Theo bài tập: số lượt làm + số bài đã chấm (top 8 theo lượt làm).
    const perExerciseRaw = await this.attemptModel.aggregate([
      { $group: { _id: '$exerciseId', attempts: { $sum: 1 } } },
      { $sort: { attempts: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'exercises', localField: '_id', foreignField: '_id', as: 'ex' } },
      { $unwind: { path: '$ex', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, attempts: 1, title: '$ex.title' } },
    ]);

    const series = await this.attemptsSeries(7);

    return {
      distribution,
      avgScore: avgRow[0]?.avg != null ? Math.round(avgRow[0].avg * 10) / 10 : null,
      submissionRate: totalSub ? Math.round((gradedSub / totalSub) * 100) : 0,
      gradedCount: gradedSub,
      totalSubmissions: totalSub,
      perExercise: perExerciseRaw.map((r: any) => ({
        exerciseId: String(r._id),
        title: r.title || 'Bài tập',
        attempts: r.attempts,
      })),
      weeklySeries: series,
    };
  }
}
