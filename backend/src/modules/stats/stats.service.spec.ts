import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { User } from '../../schemas/user.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { Article } from '../../schemas/article.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Submission } from '../../schemas/exercise/submission.schema';

describe('StatsService', () => {
  let service: StatsService;
  let userModel: any;
  let fileModel: any;
  let exerciseModel: any;
  let articleModel: any;
  let questionModel: any;
  let attemptModel: any;
  let submissionModel: any;

  const makeModel = () => ({
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
    find: jest.fn(),
  });

  beforeEach(async () => {
    userModel = makeModel();
    fileModel = makeModel();
    exerciseModel = makeModel();
    articleModel = makeModel();
    questionModel = makeModel();
    attemptModel = makeModel();
    submissionModel = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(FileItem.name), useValue: fileModel },
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(Article.name), useValue: articleModel },
        { provide: getModelToken(Question.name), useValue: questionModel },
        { provide: getModelToken(Attempt.name), useValue: attemptModel },
        { provide: getModelToken(Submission.name), useValue: submissionModel },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('overview', () => {
    it('returns documented counts / grading / trends / activity / topFiles shape', async () => {
      userModel.countDocuments.mockResolvedValue(10);
      fileModel.countDocuments.mockResolvedValue(20);
      exerciseModel.countDocuments.mockResolvedValue(5);
      articleModel.countDocuments.mockResolvedValue(3);
      questionModel.countDocuments.mockResolvedValue(40);
      attemptModel.countDocuments.mockResolvedValue(7);
      // submissionModel.countDocuments is called for total ({}) then graded ({isGraded:true})
      submissionModel.countDocuments.mockImplementation((q: any) =>
        Promise.resolve(q && q.isGraded ? 4 : 9),
      );
      attemptModel.aggregate.mockResolvedValue([]); // empty daily series buckets
      fileModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ name: 'f1', viewCount: 100 }]),
      });

      const res = await service.overview();

      expect(res.counts).toEqual({
        users: 10,
        files: 20,
        exercises: 5,
        articles: 3,
        questions: 40,
        attempts: 7,
        submissions: 9,
      });
      expect(res.grading).toEqual({ graded: 4, ungraded: 5 });
      // trends keys present (values null/number depending on counts)
      expect(res.trends).toEqual(
        expect.objectContaining({
          users: expect.anything(),
          files: expect.anything(),
          exercises: expect.anything(),
          articles: expect.anything(),
        }),
      );
      // activity.series is a 30-day densified series
      expect(res.activity.series).toHaveLength(30);
      expect(res.activity.series[0]).toEqual(
        expect.objectContaining({ date: expect.any(String), count: expect.any(Number) }),
      );
      expect(typeof res.activity.total).toBe('number');
      expect(res.topFiles).toEqual([{ name: 'f1', viewCount: 100 }]);

      // topFiles query has no phantom filter (FileItem has no isActive field)
      expect(fileModel.find).toHaveBeenCalledWith({});
    });

    it('densifies the activity series from sparse aggregate rows', async () => {
      const today = new Date().toISOString().slice(0, 10);
      attemptModel.aggregate.mockResolvedValue([{ _id: today, count: 3 }]);
      // activity.total is derived from the 30-day trend window (countIn),
      // not the series sum, so it tracks countDocuments here.
      attemptModel.countDocuments.mockResolvedValue(11);
      fileModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const res = await service.overview();
      const todayRow = res.activity.series.find((s: any) => s.date === today);
      expect(todayRow?.count).toBe(3);
      expect(res.activity.total).toBe(11);
    });
  });

  describe('reports', () => {
    it('returns distribution / avgScore / submissionRate / perExercise / weeklySeries shape', async () => {
      // submissionModel.aggregate is called twice: distribution buckets, then avg/max.
      submissionModel.aggregate
        .mockResolvedValueOnce([
          { _id: 0, count: 1 },
          { _id: 80, count: 2 },
        ])
        .mockResolvedValueOnce([{ _id: null, avg: 7.25, max: 10 }]);
      // total then graded
      submissionModel.countDocuments
        .mockResolvedValueOnce(8) // totalSub
        .mockResolvedValueOnce(6); // gradedSub
      // perExercise aggregate, then weekly attemptsSeries aggregate
      attemptModel.aggregate
        .mockResolvedValueOnce([{ _id: 'ex1', attempts: 5, title: 'Bài 1' }])
        .mockResolvedValueOnce([]);

      const res = await service.reports();

      // distribution has exactly the 5 labelled buckets
      expect(res.distribution).toHaveLength(5);
      expect(res.distribution[0]).toEqual({ label: '0–5 · Cần cố gắng', count: 1 });
      expect(res.distribution.find((d: any) => d.label === '8–9 · Giỏi')?.count).toBe(2);
      // buckets with no rows default to 0
      expect(res.distribution.find((d: any) => d.label === '9–10 · Xuất sắc')?.count).toBe(0);

      expect(res.avgScore).toBe(7.3); // rounded to 1 decimal
      expect(res.submissionRate).toBe(75); // round(6/8*100)
      expect(res.gradedCount).toBe(6);
      expect(res.totalSubmissions).toBe(8);

      expect(res.perExercise).toEqual([{ exerciseId: 'ex1', title: 'Bài 1', attempts: 5 }]);
      expect(res.weeklySeries).toHaveLength(7);
    });

    it('handles empty data: null avgScore, 0 submissionRate, fallback title', async () => {
      submissionModel.aggregate
        .mockResolvedValueOnce([]) // no distribution rows
        .mockResolvedValueOnce([]); // no avg row
      submissionModel.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      attemptModel.aggregate
        .mockResolvedValueOnce([{ _id: 'ex2', attempts: 1 }]) // no title → fallback
        .mockResolvedValueOnce([]);

      const res = await service.reports();

      expect(res.avgScore).toBeNull();
      expect(res.submissionRate).toBe(0);
      expect(res.distribution.every((d: any) => d.count === 0)).toBe(true);
      expect(res.perExercise[0].title).toBe('Bài tập');
    });
  });
});
