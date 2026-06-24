import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from '../../schemas/question-bank/topic.schema';
import { convertStringToObjectId } from '../../common/utils';
import { UserRole } from '../../enums';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ListTopicsDto } from './dto/list-topics.dto';

@Injectable()
export class TopicsService {
  constructor(@InjectModel(Topic.name) private readonly topicModel: Model<Topic>) {}

  async list(userId: string, dto: ListTopicsDto) {
    const query: Record<string, any> = {
      userId: convertStringToObjectId(userId),
      parentId: dto.parentId ? convertStringToObjectId(dto.parentId) : null,
    };
    return this.topicModel.find(query).sort({ createdAt: -1 }).lean();
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

  /** Bộ lọc theo chủ sở hữu (Admin bỏ qua kiểm tra). */
  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateTopicDto, userId: string, role?: UserRole) {
    const patch: Record<string, any> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.parentId !== undefined) {
      patch.parentId = dto.parentId ? convertStringToObjectId(dto.parentId) : null;
    }
    const topic = await this.topicModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), patch, { new: true })
      .lean();
    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề');
    return topic;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const res = await this.topicModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy chủ đề');
    return { deleted: true };
  }
}
