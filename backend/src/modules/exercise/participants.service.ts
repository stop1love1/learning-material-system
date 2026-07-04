import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { User } from '../../schemas/user.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { UserRole } from '../../enums';
import { ListParticipantsDto } from './dto/list-participants.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * Đảm bảo `participant` thuộc một bài tập do `userId` sở hữu (Admin được bỏ qua).
   * Participant chỉ trỏ tới attemptId → resolve attempt → exercise → kiểm tra userId.
   */
  private async assertOwnership(participant: any, userId?: string, role?: UserRole): Promise<void> {
    if (role === UserRole.Admin || !userId) return;
    const attempt = participant?.attemptId
      ? await this.attemptModel.findById(participant.attemptId).select('exerciseId').lean()
      : null;
    const exercise = attempt?.exerciseId
      ? await this.exerciseModel.findById(attempt.exerciseId).select('userId').lean()
      : null;
    if (!exercise || exercise.userId?.toString() !== userId) {
      throw new ForbiddenException('Không có quyền truy cập thí sinh này');
    }
  }

  async list(dto: ListParticipantsDto, userId?: string, role?: UserRole) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {};

    // Owner-scoping: ngoài Admin, giáo viên chỉ thấy thí sinh của bài tập DO MÌNH sở hữu.
    const isAdmin = role === UserRole.Admin;
    const exerciseFilter: Record<string, any> = {};
    if (dto.exerciseId) exerciseFilter._id = convertStringToObjectId(dto.exerciseId);
    if (!isAdmin && userId) exerciseFilter.userId = convertStringToObjectId(userId);

    // Participant chỉ trỏ tới attemptId; resolve các attempt thuộc exercise (đã lọc quyền) rồi lọc.
    if (Object.keys(exerciseFilter).length > 0) {
      const exercises = await this.exerciseModel.find(exerciseFilter).select('_id').lean();
      const attempts = await this.attemptModel
        .find({ exerciseId: { $in: exercises.map((e) => e._id) } })
        .select('_id')
        .lean();
      query.attemptId = { $in: attempts.map((a) => a._id) };
    }

    // Keyword lọc theo tên/email người dùng: resolve user ids khớp rồi giới hạn studentId.
    const safeKeyword = parseKeyword(keyword);
    if (safeKeyword) {
      const users = await this.userModel
        .find({
          $or: [
            { name: { $regex: safeKeyword, $options: 'i' } },
            { email: { $regex: safeKeyword, $options: 'i' } },
          ],
        })
        .select('_id')
        .lean();
      query.studentId = { $in: users.map((u) => u._id) };
    }

    const [records, total] = await Promise.all([
      this.participantModel
        .find(query)
        .sort({ joinedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({ path: 'studentId', select: 'name avatar email' })
        .lean(),
      this.participantModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findOne(id: string, userId?: string, role?: UserRole) {
    const participant = await this.participantModel
      .findById(convertStringToObjectId(id))
      .populate({ path: 'studentId', select: 'name avatar email' })
      .lean();
    if (!participant) throw new NotFoundException('Không tìm thấy thí sinh');
    await this.assertOwnership(participant, userId, role);
    return participant;
  }

  async update(id: string, dto: UpdateParticipantDto, userId?: string, role?: UserRole) {
    // Resolve + kiểm tra quyền sở hữu TRƯỚC khi sửa (cấm/hoàn thành) thí sinh.
    const existing = await this.participantModel
      .findById(convertStringToObjectId(id))
      .select('attemptId')
      .lean();
    if (!existing) throw new NotFoundException('Không tìm thấy thí sinh');
    await this.assertOwnership(existing, userId, role);

    const patch: Record<string, any> = {};
    if (dto.isBanned !== undefined) patch.isBanned = dto.isBanned;
    if (dto.isFinished !== undefined) {
      patch.isFinished = dto.isFinished;
      if (dto.isFinished) patch.endedAt = new Date();
    }

    const participant = await this.participantModel
      .findByIdAndUpdate(convertStringToObjectId(id), patch, { returnDocument: 'after' })
      .lean();
    if (!participant) throw new NotFoundException('Không tìm thấy thí sinh');
    return participant;
  }
}
