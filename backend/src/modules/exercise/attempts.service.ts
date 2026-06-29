import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { ExerciseQuestion } from '../../schemas/exercise/exercise-question.schema';
import { Question } from '../../schemas/question-bank/question.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Submission } from '../../schemas/exercise/submission.schema';
import { StudentQuestion } from '../../schemas/exercise/student-question.schema';
import { User } from '../../schemas/user.schema';
import { Settings } from '../../schemas/settings.schema';
import { MailService } from '../../global/mail.service';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { QuestionType } from '../../enums';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { ListAttemptsDto } from './dto/list-attempts.dto';

interface AcademicPolicy {
  scoreScale: number;
  passThreshold: number;
  rounding: string;
  allowResubmit: boolean;
  showScoreImmediately: boolean;
}

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(ExerciseQuestion.name) private readonly exerciseQuestionModel: Model<ExerciseQuestion>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<Submission>,
    @InjectModel(StudentQuestion.name) private readonly studentQuestionModel: Model<StudentQuestion>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Settings.name) private readonly settingsModel: Model<Settings>,
    private readonly mail: MailService,
  ) {}

  /** Đọc nhóm `academic` từ settings (system). Đọc phòng thủ với mặc định hợp lý. */
  private async getAcademicPolicy(): Promise<AcademicPolicy> {
    const defaults: AcademicPolicy = {
      scoreScale: 10,
      passThreshold: 5,
      rounding: 'none',
      allowResubmit: false,
      showScoreImmediately: true,
    };
    try {
      const doc = await this.settingsModel.findOne({ key: 'system' }).select('academic').lean();
      const a = (doc as any)?.academic ?? {};
      return {
        scoreScale: typeof a.scoreScale === 'number' ? a.scoreScale : defaults.scoreScale,
        passThreshold: typeof a.passThreshold === 'number' ? a.passThreshold : defaults.passThreshold,
        rounding: typeof a.rounding === 'string' ? a.rounding : defaults.rounding,
        allowResubmit: typeof a.allowResubmit === 'boolean' ? a.allowResubmit : defaults.allowResubmit,
        showScoreImmediately:
          typeof a.showScoreImmediately === 'boolean' ? a.showScoreImmediately : defaults.showScoreImmediately,
      };
    } catch {
      return defaults;
    }
  }

  /** Đọc 1 cờ thông báo từ settings (mặc định true). */
  private async getEmailOnSubmit(): Promise<boolean> {
    try {
      const doc = await this.settingsModel.findOne({ key: 'system' }).select('notifications').lean();
      const n = (doc as any)?.notifications ?? {};
      return typeof n.emailOnSubmit === 'boolean' ? n.emailOnSubmit : true;
    } catch {
      return true;
    }
  }

  /**
   * Áp chính sách điểm: clamp [0, scoreScale], làm tròn theo rounding, và tính isPassed.
   * `raw` là điểm đã ở thang scoreScale (caller tự scale nếu nguồn là count/percent).
   */
  private applyScorePolicy(raw: number, policy: AcademicPolicy): { score: number; isPassed: boolean } {
    let score = raw;
    if (!Number.isFinite(score)) score = 0;
    // (a) clamp
    score = Math.max(0, Math.min(policy.scoreScale, score));
    // (b) round
    if (policy.rounding === 'half') score = Math.round(score * 2) / 2;
    else if (policy.rounding === 'integer') score = Math.round(score);
    // (c) pass/fail
    const isPassed = score >= policy.passThreshold;
    return { score, isPassed };
  }

  /**
   * Chấm tự động một câu KHÁCH QUAN từ đáp án ĐÃ LƯU trong bản ghi chi tiết
   * (question.questionDetail, đã populate). Trả về:
   *   true/false = đúng/sai · null = không chấm được tự động (chờ chấm tay).
   * Tuyệt đối không dựa vào dữ liệu client gửi lên.
   */
  private gradeObjective(question: any, answer: unknown): boolean | null {
    const detail = question?.questionDetail;
    if (!detail) return null; // thiếu đáp án gốc → chờ chấm tay
    const type = question.type;

    switch (type) {
      case QuestionType.Single: {
        const idx = this.toIndex(answer);
        if (idx === null) return false;
        return idx === detail.correctOptionIndex;
      }
      case QuestionType.Multi: {
        const picked = this.toIndexArray(answer);
        const correctIdx: number[] = Array.isArray(detail.correctOptionIndices)
          ? detail.correctOptionIndices
          : [];
        if (picked === null) return false;
        return this.sameNumberSet(picked, correctIdx);
      }
      case QuestionType.TrueFalse: {
        if (typeof answer !== 'boolean') return false;
        return answer === detail.isCorrect;
      }
      case QuestionType.Fill: {
        // ShortAnswer: answer = string | string[]; đúng nếu khớp BẤT KỲ đáp án nào.
        const accepted: string[] = Array.isArray(detail.answers) ? detail.answers : [];
        const given = Array.isArray(answer) ? answer : [answer];
        const mode = detail.matchMode;
        return given.some((g) => accepted.some((a) => this.matchText(String(a), g, mode)));
      }
      case QuestionType.Number: {
        const accepted: string[] = Array.isArray(detail.answers) ? detail.answers : [];
        const given = Array.isArray(answer) ? answer[0] : answer;
        const gNum = this.toNumber(given);
        if (gNum === null) return false;
        return accepted.some((a) => {
          const aNum = this.toNumber(a);
          return aNum !== null && aNum === gNum;
        });
      }
      case QuestionType.Sort: {
        const order = this.toIndexArray(answer);
        const correctOrder: number[] = Array.isArray(detail.correctOrder) ? detail.correctOrder : [];
        if (order === null) return false;
        return this.sameNumberSeq(order, correctOrder);
      }
      case QuestionType.TableSelection: {
        const correctAnswers: boolean[] = Array.isArray(detail.correctAnswers)
          ? detail.correctAnswers
          : [];
        if (!Array.isArray(answer) || answer.length !== correctAnswers.length) return false;
        return correctAnswers.every((c, i) => Boolean(answer[i]) === c);
      }
      case QuestionType.Match: {
        // pairs = [{left,right}]. Đáp án học viên: mảng [{left,right}] hoặc map {left:right}.
        const pairs: { left: string; right: string }[] = Array.isArray(detail.pairs)
          ? detail.pairs
          : [];
        if (pairs.length === 0) return null;
        const givenMap = this.toMatchMap(answer);
        if (!givenMap) return false;
        return pairs.every((p) => givenMap.get(String(p.left)) === String(p.right));
      }
      default:
        return null; // loại không xác định → chờ chấm tay
    }
  }

  /** answer → chỉ số (number) hoặc null. Hỗ trợ số hoặc chuỗi số. */
  private toIndex(answer: unknown): number | null {
    if (typeof answer === 'number' && Number.isInteger(answer)) return answer;
    if (typeof answer === 'string' && answer.trim() !== '' && Number.isInteger(Number(answer))) {
      return Number(answer);
    }
    return null;
  }

  /** answer → mảng chỉ số, hoặc null nếu không phải mảng hợp lệ. */
  private toIndexArray(answer: unknown): number[] | null {
    if (!Array.isArray(answer)) return null;
    const out: number[] = [];
    for (const a of answer) {
      const i = this.toIndex(a);
      if (i === null) return null;
      out.push(i);
    }
    return out;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const n = Number(value.replace(/,/g, '.').trim());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  /** So khớp 2 tập chỉ số không quan tâm thứ tự (loại trùng). */
  private sameNumberSet(a: number[], b: number[]): boolean {
    const sa = new Set(a);
    const sb = new Set(b);
    if (sa.size !== sb.size) return false;
    for (const x of sa) if (!sb.has(x)) return false;
    return true;
  }

  /** So khớp 2 dãy chỉ số theo đúng thứ tự. */
  private sameNumberSeq(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((x, i) => x === b[i]);
  }

  /** So khớp văn bản theo matchMode (exact / caseless / trimmed). */
  private matchText(expected: string, given: unknown, mode: string): boolean {
    if (typeof given !== 'string') return false;
    const norm = (s: string) => {
      let v = s;
      if (mode === 'trimmed') v = v.trim();
      else if (mode === 'caseless') v = v.trim().toLowerCase();
      else v = v; // exact
      return v;
    };
    // exact: so sánh nguyên trạng; các mode khác chuẩn hoá cả 2 vế.
    if (mode === 'exact') return expected === given;
    return norm(expected) === norm(given);
  }

  /** Chuẩn hoá đáp án ghép đôi về Map(left→right). */
  private toMatchMap(answer: unknown): Map<string, string> | null {
    const map = new Map<string, string>();
    if (Array.isArray(answer)) {
      for (const item of answer as any[]) {
        if (item && typeof item === 'object' && 'left' in item && 'right' in item) {
          map.set(String((item as any).left), String((item as any).right));
        } else {
          return null;
        }
      }
      return map;
    }
    if (answer && typeof answer === 'object') {
      for (const [k, v] of Object.entries(answer as Record<string, unknown>)) {
        map.set(String(k), String(v));
      }
      return map;
    }
    return null;
  }

  async start(dto: StartAttemptDto, userId: string) {
    const exerciseId = convertStringToObjectId(dto.exerciseId);
    const exercise = await this.exerciseModel.findById(exerciseId).lean();
    if (!exercise) throw new NotFoundException('Không tìm thấy bài tập');

    const studentId = convertStringToObjectId(userId);
    const existing = await this.attemptModel.countDocuments({ exerciseId, studentId });

    const maxAttempts = exercise.maxAttempts ?? 1;
    if (existing >= maxAttempts) {
      throw new ConflictException(`Bạn đã dùng hết ${maxAttempts} lượt làm cho bài tập này`);
    }

    const attempt = await this.attemptModel.create({
      exerciseId,
      studentId,
      attemptNumber: existing + 1,
    });

    await this.participantModel.create({
      attemptId: attempt._id,
      studentId,
      startedAt: new Date(),
    });

    return attempt.toObject();
  }

  async submit(attemptId: string, dto: SubmitAttemptDto, userId: string) {
    const id = convertStringToObjectId(attemptId);
    const studentId = convertStringToObjectId(userId);
    const attempt = await this.attemptModel.findById(id);
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');
    if (!attempt.studentId || attempt.studentId.toString() !== studentId.toString()) {
      throw new ForbiddenException('Không có quyền nộp lượt làm này');
    }

    const policy = await this.getAcademicPolicy();

    // Chặn nộp LẠI chính lượt này nếu đã nộp rồi và không cho phép nộp lại.
    // (Trước đây chỉ chặn các lượt KHÁC → re-POST cùng attempt vẫn tính lại điểm.)
    if (attempt.submittedAt && !policy.allowResubmit) {
      throw new ConflictException('Lượt làm này đã nộp và không cho phép nộp lại.');
    }

    // Respect allowResubmit: nếu tắt và học viên đã có lượt khác (cùng exercise) đã nộp,
    // chặn nộp mới. Bỏ qua chính lượt hiện tại (cho phép cập nhật lại bài chưa nộp lần nào).
    if (!policy.allowResubmit) {
      const priorSubmitted = await this.attemptModel.exists({
        exerciseId: attempt.exerciseId,
        studentId,
        submittedAt: { $ne: null },
        _id: { $ne: id },
      });
      if (priorSubmitted) {
        throw new ConflictException('Bài tập này không cho phép nộp lại — bạn đã có lượt làm đã nộp.');
      }
    }

    // Enforce maxAttempts: tổng số lượt đã nộp (cùng exercise) không vượt giới hạn.
    // Lượt hiện tại tính vào nếu chưa nộp lần nào.
    const exerciseDoc = await this.exerciseModel
      .findById(attempt.exerciseId)
      .select('maxAttempts dueDate allowLateSubmit showScoreAfter')
      .lean();

    // Hạn nộp: nếu đã quá dueDate và bài KHÔNG cho nộp muộn → từ chối nộp.
    // (allowLateSubmit = true thì cho qua; không có field "late" riêng nên không đánh dấu.)
    if (exerciseDoc?.dueDate && !exerciseDoc.allowLateSubmit) {
      const due = new Date(exerciseDoc.dueDate).getTime();
      if (Number.isFinite(due) && Date.now() > due) {
        throw new BadRequestException('Đã quá hạn nộp bài');
      }
    }

    const maxAttempts = exerciseDoc?.maxAttempts ?? 1;
    const submittedCount = await this.attemptModel.countDocuments({
      exerciseId: attempt.exerciseId,
      studentId,
      submittedAt: { $ne: null },
      _id: { $ne: id },
    });
    const effectiveCount = attempt.submittedAt ? submittedCount : submittedCount + 1;
    if (effectiveCount > maxAttempts) {
      throw new ConflictException(`Bạn đã dùng hết ${maxAttempts} lượt nộp cho bài tập này`);
    }

    // SERVER-SIDE GRADING. Tải các câu hỏi của bài tập kèm bản ghi chi tiết đa hình
    // (questionDetail / questionModel) — KHÔNG tin ans.isCorrect / ans.grades từ client.
    const links = await this.exerciseQuestionModel
      .find({ exerciseId: attempt.exerciseId })
      .select('questionId grades')
      .lean();
    const qIds = links.map((l) => l.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: qIds } })
      .populate('questionDetail')
      .lean();
    const questionMap = new Map(questions.map((q: any) => [String(q._id), q]));
    // Điểm tối đa mỗi câu (mặc định 1đ nếu link.grades chưa đặt).
    const pointsMap = new Map(
      links.map((l: any) => [String(l.questionId), l.grades != null ? l.grades : 1]),
    );
    const essayIds = new Set(
      questions.filter((q: any) => q.type === QuestionType.Essay).map((q: any) => String(q._id)),
    );

    let correct = 0;
    let wrong = 0;
    let notComplete = 0;
    let waitingGrades = 0;
    let numberOfEssays = 0;
    let multipleChoiceGrades = 0;
    let essayGrades: number | null = null;

    for (const ans of dto.answers) {
      const questionId = convertStringToObjectId(ans.questionId);
      const key = String(questionId);
      const question = questionMap.get(key);
      const isEssay = essayIds.has(key);
      const maxPoints = pointsMap.get(key) ?? 1;
      const answer = ans.answer ?? null;

      // Tính isCorrect/grades phía server theo đáp án ĐÃ LƯU; bỏ qua giá trị client.
      let isCorrect: boolean | null = null;
      let grades: number | null = null;
      if (!isEssay && question) {
        const verdict = this.gradeObjective(question, answer);
        if (verdict !== null) {
          isCorrect = verdict;
          grades = verdict ? maxPoints : 0;
        }
      }

      await this.studentQuestionModel.findOneAndUpdate(
        { attemptId: id, questionId },
        {
          attemptId: id,
          questionId,
          studentId,
          answer,
          isCorrect,
          grades,
        },
        { upsert: true, new: true },
      );

      if (isCorrect === true) correct += 1;
      else if (isCorrect === false) wrong += 1;
      else notComplete += 1;

      if (isEssay) {
        numberOfEssays += 1;
        // Tự luận luôn chấm tay → chờ giáo viên.
        waitingGrades += 1;
      } else if (grades !== null) {
        multipleChoiceGrades += grades;
      } else {
        // Câu khách quan không chấm được tự động (thiếu detail/đáp án) → chờ chấm tay.
        waitingGrades += 1;
      }
    }

    const set: Record<string, unknown> = {
      attemptId: id,
      correct,
      wrong,
      notComplete,
      waitingGrades,
      numberOfEssays,
      multipleChoiceGrades,
      essayGrades,
      submittedAt: new Date(),
    };

    // Auto-graded quiz: nếu không còn câu chờ chấm tay (waitingGrades === 0) thì điểm
    // đã là cuối cùng → scale raw lên scoreScale, áp policy và lưu totalScore/percent/isPassed.
    // Tổng điểm thô tối đa = sum(grades) của các câu trong bài (mặc định 1đ/câu nếu chưa đặt).
    if (waitingGrades === 0) {
      const rawEarned = (multipleChoiceGrades || 0) + (essayGrades || 0);
      const maxRaw = links.reduce((sum, l: any) => sum + (l.grades != null ? l.grades : 1), 0);
      const scaled = maxRaw > 0 ? (rawEarned / maxRaw) * policy.scoreScale : 0;
      const { score, isPassed } = this.applyScorePolicy(scaled, policy);
      set.totalScore = score;
      set.percent = maxRaw > 0 ? Math.round((rawEarned / maxRaw) * 100) : 0;
      set.isPassed = isPassed;
      set.isGraded = true;
    }

    const submission = await this.submissionModel.findOneAndUpdate(
      { attemptId: id },
      {
        $set: set,
        $inc: { submissionCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    attempt.submittedAt = new Date();
    await attempt.save();

    await this.participantModel.findOneAndUpdate(
      { attemptId: id },
      { isFinished: true, endedAt: new Date() },
    );

    // Thông báo email cho chủ bài tập (best-effort, không bao giờ làm hỏng submit).
    await this.notifyOwnerOnSubmit(attempt.exerciseId, studentId).catch(() => undefined);

    // showScoreAfter (bài) hoặc showScoreImmediately (hệ thống) = false → KHÔNG lộ
    // điểm/đúng-sai ngay khi nộp; chỉ xác nhận "đã nộp, chờ công bố". Mặc định (true)
    // giữ nguyên hành vi cũ.
    const revealScore = (exerciseDoc?.showScoreAfter ?? true) && policy.showScoreImmediately;
    const result = submission.toObject() as any;
    if (!revealScore) {
      return this.withheldSubmission(result);
    }
    return result;
  }

  /**
   * Ẩn điểm/đúng-sai khỏi bản ghi submission trả về (khi chưa được phép công bố).
   * Trả về trạng thái "đã nộp, chờ công bố" — giữ các trường định danh/thời gian.
   */
  private withheldSubmission(submission: any): any {
    if (!submission || typeof submission !== 'object') return submission;
    const {
      totalScore,
      percent,
      isPassed,
      correct,
      wrong,
      notComplete,
      multipleChoiceGrades,
      essayGrades,
      ...rest
    } = submission;
    return { ...rest, scoreWithheld: true };
  }

  /** Gửi email cho người tạo bài tập khi có bài nộp (nếu notifications.emailOnSubmit bật). */
  private async notifyOwnerOnSubmit(exerciseId: Types.ObjectId, studentId: Types.ObjectId): Promise<void> {
    try {
      const enabled = await this.getEmailOnSubmit();
      if (!enabled) return;
      const exercise = await this.exerciseModel.findById(exerciseId).select('userId title').lean();
      if (!exercise?.userId) return;
      const [owner, student] = await Promise.all([
        this.userModel.findById(exercise.userId).select('email name').lean(),
        this.userModel.findById(studentId).select('name email').lean(),
      ]);
      if (!owner?.email) return;
      const studentName = student?.name || student?.email || 'Một học viên';
      const title = exercise.title || 'Bài tập';
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
          <h2 style="color:#0f766e">Có bài nộp mới</h2>
          <p><strong>${studentName}</strong> vừa nộp bài cho bài tập <strong>${title}</strong>.</p>
          <p style="color:#6b7280;font-size:13px">Đăng nhập hệ thống để xem và chấm bài.</p>
        </div>`;
      await this.mail.sendMail(owner.email, 'Có bài nộp mới', html);
    } catch (err) {
      this.logger.warn(`Gửi email báo bài nộp thất bại: ${(err as Error)?.message ?? err}`);
    }
  }

  async result(attemptId: string, userId: string) {
    const id = convertStringToObjectId(attemptId);
    const attempt = await this.attemptModel.findById(id).lean();
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');

    // Allow the owning student OR the exercise's author/teacher.
    const isOwner = attempt.studentId && attempt.studentId.toString() === userId;
    const exercise = await this.exerciseModel
      .findById(attempt.exerciseId)
      .select('userId showScoreAfter')
      .lean();
    const isAuthor = exercise && exercise.userId?.toString() === userId;
    if (!isOwner && !isAuthor) throw new ForbiddenException('Không có quyền xem kết quả này');

    const [submission, studentQuestions] = await Promise.all([
      this.submissionModel.findOne({ attemptId: id }).lean(),
      this.studentQuestionModel.find({ attemptId: id }).lean(),
    ]);

    // Với HỌC VIÊN (không phải tác giả), nếu bài đặt showScoreAfter=false hoặc hệ thống
    // showScoreImmediately=false thì ẩn điểm/đúng-sai cho tới khi được công bố. Tác giả/
    // giáo viên luôn xem đầy đủ để chấm.
    if (!isAuthor && submission) {
      const policy = await this.getAcademicPolicy();
      const revealScore = (exercise?.showScoreAfter ?? true) && policy.showScoreImmediately;
      if (!revealScore) {
        const sq = studentQuestions.map((q: any) => {
          const { isCorrect, grades, ...rest } = q;
          return rest;
        });
        return { attempt, submission: this.withheldSubmission(submission), studentQuestions: sq };
      }
    }

    return { attempt, submission, studentQuestions };
  }

  async grade(attemptId: string, dto: GradeAttemptDto, graderId: string) {
    const id = convertStringToObjectId(attemptId);
    const attempt = await this.attemptModel.findById(id).lean();
    if (!attempt) throw new NotFoundException('Không tìm thấy lượt làm');

    for (const ans of dto.answers) {
      const questionId = convertStringToObjectId(ans.questionId);
      const patch: Record<string, unknown> = {};
      if (ans.grades !== undefined) patch.grades = ans.grades;
      if (ans.isCorrect !== undefined) patch.isCorrect = ans.isCorrect;
      if (ans.feedback !== undefined) patch.feedback = ans.feedback;
      if (Object.keys(patch).length === 0) continue;
      await this.studentQuestionModel.updateOne({ attemptId: id, questionId }, { $set: patch });
    }

    const studentQuestions = await this.studentQuestionModel.find({ attemptId: id }).lean();
    const links = await this.exerciseQuestionModel
      .find({ exerciseId: attempt.exerciseId })
      .select('questionId grades')
      .lean();
    const essayDocs = await this.questionModel
      .find({ _id: { $in: links.map((l) => l.questionId) }, type: QuestionType.Essay })
      .select('_id')
      .lean();
    const essayIds = new Set(essayDocs.map((q) => String(q._id)));
    // Tổng điểm thô tối đa của bài (mặc định 1đ/câu) — để quy đổi điểm cuối.
    const maxRaw = links.reduce((sum, l: any) => sum + (l.grades != null ? l.grades : 1), 0);

    let correct = 0;
    let wrong = 0;
    let notComplete = 0;
    let waitingGrades = 0;
    let numberOfEssays = 0;
    let multipleChoiceGrades = 0;
    let essayGrades: number | null = null;

    for (const sq of studentQuestions) {
      if (sq.isCorrect === true) correct += 1;
      else if (sq.isCorrect === false) wrong += 1;
      else notComplete += 1;

      const isEssay = essayIds.has(String(sq.questionId));
      if (isEssay) {
        numberOfEssays += 1;
        if (sq.grades !== null && sq.grades !== undefined) essayGrades = (essayGrades ?? 0) + sq.grades;
        else waitingGrades += 1;
      } else if (sq.grades !== null && sq.grades !== undefined) {
        multipleChoiceGrades += sq.grades;
      } else if (sq.isCorrect === null || sq.isCorrect === undefined) {
        waitingGrades += 1;
      }
    }

    const set: Record<string, unknown> = {
      correct,
      wrong,
      notComplete,
      waitingGrades,
      numberOfEssays,
      multipleChoiceGrades,
      essayGrades,
      // Chỉ coi là đã chấm xong khi không còn câu chờ chấm tay — nếu không, lượt
      // vẫn phải nằm trong danh sách chờ chấm (listForGrading pendingOnly).
      isGraded: waitingGrades === 0,
      gradedBy: convertStringToObjectId(graderId),
      gradedAt: new Date(),
    };

    const policy = await this.getAcademicPolicy();
    if (dto.totalScore !== undefined) {
      // Áp chính sách academic lên điểm cuối do giáo viên nhập: clamp/làm tròn + đạt/không đạt.
      const { score, isPassed } = this.applyScorePolicy(dto.totalScore, policy);
      set.totalScore = score;
      set.isPassed = isPassed;
      if (dto.percent === undefined) {
        set.percent = maxRaw > 0 ? Math.round((dto.totalScore / policy.scoreScale) * 100) : 0;
      }
    } else if (waitingGrades === 0) {
      // Không truyền totalScore: tính lại điểm cuối từ điểm từng câu giáo viên đã nhập.
      const rawEarned = (multipleChoiceGrades || 0) + (essayGrades || 0);
      const scaled = maxRaw > 0 ? (rawEarned / maxRaw) * policy.scoreScale : 0;
      const { score, isPassed } = this.applyScorePolicy(scaled, policy);
      set.totalScore = score;
      set.isPassed = isPassed;
      if (dto.percent === undefined) {
        set.percent = maxRaw > 0 ? Math.round((rawEarned / maxRaw) * 100) : 0;
      }
    }
    if (dto.percent !== undefined) set.percent = dto.percent;
    if (dto.feedback !== undefined) set.feedback = dto.feedback;

    const submission = await this.submissionModel.findOneAndUpdate(
      { attemptId: id },
      { $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return submission ? submission.toObject() : null;
  }

  async listForGrading(dto: ListAttemptsDto) {
    const { page, pageSize } = getPagination(undefined, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      ...(dto.exerciseId ? { exerciseId: convertStringToObjectId(dto.exerciseId) } : {}),
      ...(dto.studentId ? { studentId: convertStringToObjectId(dto.studentId) } : {}),
      submittedAt: { $ne: null },
    };

    // pendingOnly: loại các lượt đã có submission đã chấm — đưa vào query TRƯỚC khi
    // phân trang để total + số bản ghi mỗi trang đều chính xác.
    if (dto.pendingOnly === 'true') {
      const gradedSubs = await this.submissionModel.find({ isGraded: true }).select('attemptId').lean();
      const gradedIds = gradedSubs.map((s: any) => s.attemptId).filter(Boolean);
      if (gradedIds.length) query._id = { $nin: gradedIds };
    }

    const [attempts, total] = await Promise.all([
      this.attemptModel
        .find(query)
        .sort({ submittedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({ path: 'studentId', select: 'name email avatar' })
        .populate({ path: 'exerciseId', select: 'title type points' })
        .lean(),
      this.attemptModel.countDocuments(query),
    ]);

    const attemptIds = attempts.map((a: any) => a._id);
    const submissions = await this.submissionModel.find({ attemptId: { $in: attemptIds } }).lean();
    const subMap = new Map(submissions.map((s: any) => [s.attemptId.toString(), s]));

    const records = attempts.map((a: any) => {
      const submission = subMap.get(a._id.toString()) ?? null;
      return {
        ...a,
        submission,
        status: submission ? (submission.isGraded ? 'graded' : 'submitted') : 'submitted',
      };
    });

    return buildPagination(records, total, page, pageSize);
  }

  async listMine(userId: string) {
    const studentId = convertStringToObjectId(userId);
    const attempts = await this.attemptModel.find({ studentId }).sort({ createdAt: -1 }).lean();
    if (!attempts.length) return [];
    const submissions = await this.submissionModel
      .find({ attemptId: { $in: attempts.map((a: any) => a._id) } })
      .lean();
    const subMap = new Map(submissions.map((s: any) => [s.attemptId.toString(), s]));
    return attempts.map((a: any) => {
      const submission = subMap.get(a._id.toString()) ?? null;
      const status = a.submittedAt
        ? submission && submission.isGraded
          ? 'graded'
          : 'submitted'
        : 'in-progress';
      return {
        _id: a._id,
        exerciseId: a.exerciseId,
        attemptNumber: a.attemptNumber,
        submittedAt: a.submittedAt ?? null,
        status,
        totalScore: submission ? submission.totalScore ?? null : null,
        percent: submission ? submission.percent ?? null : null,
      };
    });
  }
}
