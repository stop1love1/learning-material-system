import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SelfAssessment } from '../../schemas/exercise/self-assessment.schema';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { convertStringToObjectId } from '../../common/utils';
import { CreateSelfAssessmentDto } from './dto/create-self-assessment.dto';

@Injectable()
export class SelfAssessmentService {
  constructor(
    @InjectModel(SelfAssessment.name) private readonly selfAssessmentModel: Model<SelfAssessment>,
    @InjectModel(Rubric.name) private readonly rubricModel: Model<Rubric>,
  ) {}

  async create(dto: CreateSelfAssessmentDto, userId: string) {
    const { rubricId, fileId, exerciseId, scores, ...rest } = dto;
    const selfAssessment = await this.selfAssessmentModel.create({
      ...rest,
      userId: convertStringToObjectId(userId),
      rubricId: convertStringToObjectId(rubricId),
      ...(fileId ? { fileId: convertStringToObjectId(fileId) } : {}),
      ...(exerciseId ? { exerciseId: convertStringToObjectId(exerciseId) } : {}),
      ...(scores
        ? {
            scores: scores.map((s) => ({
              criterionId: convertStringToObjectId(s.criterionId),
              levelId: s.levelId ? convertStringToObjectId(s.levelId) : null,
              percent: s.percent ?? 0,
            })),
          }
        : {}),
    });
    await this.rubricModel.updateOne(
      { _id: convertStringToObjectId(rubricId) },
      { $inc: { usedCount: 1 } },
    );
    return selfAssessment.toObject();
  }

  async listOwn(userId: string) {
    return this.selfAssessmentModel
      .find({ userId: convertStringToObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    const selfAssessment = await this.selfAssessmentModel.findById(convertStringToObjectId(id)).lean();
    if (!selfAssessment) throw new NotFoundException('Không tìm thấy bài tự đánh giá');
    return selfAssessment;
  }
}
