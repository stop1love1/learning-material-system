import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from '../../schemas/exercise/participant.schema';
import { Attempt } from '../../schemas/exercise/attempt.schema';
import { User } from '../../schemas/user.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { ListParticipantsDto } from './dto/list-participants.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Attempt.name) private readonly attemptModel: Model<Attempt>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async list(dto: ListParticipantsDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {};

    // Participant chỉ trỏ tới attemptId; resolve các attempt thuộc exercise rồi lọc.
    if (dto.exerciseId) {
      const attempts = await this.attemptModel
        .find({ exerciseId: convertStringToObjectId(dto.exerciseId) })
        .select('_id')
        .lean();
      query.attemptId = { $in: attempts.map((a) => a._id) };
    }

    // Keyword lọc theo tên/email học viên: resolve user ids khớp rồi giới hạn studentId.
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

  async findOne(id: string) {
    const participant = await this.participantModel
      .findById(convertStringToObjectId(id))
      .populate({ path: 'studentId', select: 'name avatar email' })
      .lean();
    if (!participant) throw new NotFoundException('Không tìm thấy thí sinh');
    return participant;
  }

  async update(id: string, dto: UpdateParticipantDto) {
    const patch: Record<string, any> = {};
    if (dto.isBanned !== undefined) patch.isBanned = dto.isBanned;
    if (dto.isFinished !== undefined) {
      patch.isFinished = dto.isFinished;
      if (dto.isFinished) patch.endedAt = new Date();
    }

    const participant = await this.participantModel
      .findByIdAndUpdate(convertStringToObjectId(id), patch, { new: true })
      .lean();
    if (!participant) throw new NotFoundException('Không tìm thấy thí sinh');
    return participant;
  }
}
