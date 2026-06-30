import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { UserRole } from '../../enums';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ListTopicsDto } from './dto/list-topics.dto';

@Injectable()
export class TopicsService {
  constructor(@InjectModel(Topic.name) private readonly topicModel: Model<Topic>) {}

  async list(userId: string, dto: ListTopicsDto) {
    const { page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      userId: convertStringToObjectId(userId),
      parentId: dto.parentId ? convertStringToObjectId(dto.parentId) : null,
    };
    const [records, total] = await Promise.all([
      this.topicModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.topicModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async create(userId: string, dto: CreateTopicDto) {
    const topic = await this.topicModel.create({
      userId: convertStringToObjectId(userId),
      title: dto.title,
      description: dto.description ?? null,
      parentId: dto.parentId ? convertStringToObjectId(dto.parentId) : null,
    });
    const created = await this.topicModel.findById(topic._id).lean();
    if (!created) throw new NotFoundException('Không tìm thấy chủ đề');
    return created;
  }

  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateTopicDto, userId: string, role?: UserRole) {
    // findOneAndUpdate bypasses the pre('save') cycle/ancestors/depth hook;
    // load + save so the hierarchy guard fires and ancestors/depth recompute
    // when parentId changes (mirrors library folders.service.ts).
    const topic = await this.topicModel.findOne(this.ownerFilter(id, userId, role));
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề');

    if (dto.title !== undefined) topic.title = dto.title;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.parentId !== undefined) {
      topic.parentId = dto.parentId ? convertStringToObjectId(dto.parentId) : null;
    }
    await topic.save();
    return topic.toObject();
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const res = await this.topicModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy chủ đề');
    return { deleted: true };
  }
}
