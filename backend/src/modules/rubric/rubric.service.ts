import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rubric } from '../../schemas/rubric/rubric.schema';
import { RubricGroup } from '../../schemas/rubric/rubric-group.schema';
import { RubricLevel } from '../../schemas/rubric/rubric-level.schema';
import { RubricCriterion } from '../../schemas/rubric/rubric-criterion.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { RubricDto } from './dto/rubric.dto';
import { RubricGroupDto } from './dto/rubric-group.dto';

@Injectable()
export class RubricService {
  constructor(
    @InjectModel(Rubric.name) private readonly rubricModel: Model<Rubric>,
    @InjectModel(RubricGroup.name) private readonly rubricGroupModel: Model<RubricGroup>,
    @InjectModel(RubricLevel.name) private readonly rubricLevelModel: Model<RubricLevel>,
    @InjectModel(RubricCriterion.name) private readonly rubricCriterionModel: Model<RubricCriterion>,
  ) {}

  async listRubrics(userId: string, dto: { keyword?: string; page?: number; pageSize?: number; groupId?: string }) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const safeKeyword = parseKeyword(keyword);
    const query: Record<string, any> = {
      userId: convertStringToObjectId(userId),
      ...(safeKeyword ? { name: { $regex: safeKeyword, $options: 'i' } } : {}),
      ...(dto.groupId ? { groupId: convertStringToObjectId(dto.groupId) } : {}),
    };
    // Embed levels + criterions per row via an aggregation so the frontend list
    // loader needs no per-id detail fetch. Lookups run only on the page slice
    // (after $skip/$limit). Output field names match getRubric.
    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'rubric-levels',
          let: { rid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$rubricId', '$$rid'] } } }, { $sort: { order: 1 } }],
          as: 'levels',
        },
      },
      {
        $lookup: {
          from: 'rubric-criterions',
          let: { rid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$rubricId', '$$rid'] } } }, { $sort: { order: 1 } }],
          as: 'criterions',
        },
      },
    ];
    const [records, total] = await Promise.all([
      this.rubricModel.aggregate(pipeline),
      this.rubricModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async getRubric(id: string) {
    const rubricId = convertStringToObjectId(id);
    const rubric = await this.rubricModel.findById(rubricId).lean();
    if (!rubric) throw new NotFoundException('Không tìm thấy rubric');
    const [levels, criterions] = await Promise.all([
      this.rubricLevelModel.find({ rubricId }).sort({ order: 1 }).lean(),
      this.rubricCriterionModel.find({ rubricId }).sort({ order: 1 }).lean(),
    ]);
    return { ...rubric, levels, criterions };
  }

  async createRubric(userId: string, dto: RubricDto) {
    const ownerId = convertStringToObjectId(userId);
    const { levels = [], criterions = [], groupId, ...rest } = dto;

    let groupObjectId: ReturnType<typeof convertStringToObjectId> | null = null;
    if (groupId) {
      const groupExist = await this.rubricGroupModel.exists({
        _id: convertStringToObjectId(groupId),
        userId: ownerId,
      });
      if (!groupExist) throw new BadRequestException('Nhóm rubric không hợp lệ');
      groupObjectId = convertStringToObjectId(groupId);
    }

    const rubric = await this.rubricModel.create({ ...rest, userId: ownerId, groupId: groupObjectId });
    const rubricId = rubric._id;

    const newLevels = await this.rubricLevelModel.insertMany(
      levels.map(({ _id, ...level }) => ({ ...level, rubricId })),
    );

    const newCriterions = await this.rubricCriterionModel.insertMany(
      criterions.map(({ _id, levelId, ...criterion }) => ({
        ...criterion,
        rubricId,
        levelId: levelId ? convertStringToObjectId(levelId) : null,
      })),
    );

    return {
      ...rubric.toObject(),
      levels: newLevels.map((l) => l.toObject()),
      criterions: newCriterions.map((c) => c.toObject()),
    };
  }

  async updateRubric(userId: string, id: string, dto: RubricDto) {
    const ownerId = convertStringToObjectId(userId);
    const rubricId = convertStringToObjectId(id);
    const { levels = [], criterions = [], groupId, ...rest } = dto;

    const patch: Record<string, any> = { ...rest };
    if (groupId !== undefined) {
      if (groupId) {
        const group = await this.rubricGroupModel.findById(convertStringToObjectId(groupId)).lean();
        if (!group || group.userId.toString() !== userId) {
          throw new BadRequestException('Nhóm rubric không hợp lệ');
        }
        patch.groupId = convertStringToObjectId(groupId);
      } else {
        patch.groupId = null;
      }
    }

    const rubric = await this.rubricModel.findOneAndUpdate({ _id: rubricId, userId: ownerId }, patch, { new: true });
    if (!rubric) throw new NotFoundException('Không tìm thấy rubric');

    const [existingLevels, existingCriterions] = await Promise.all([
      this.rubricLevelModel.find({ rubricId }).lean(),
      this.rubricCriterionModel.find({ rubricId }).lean(),
    ]);
    const existingLevelIds = new Set(existingLevels.map((l) => l._id.toString()));
    const existingCriterionIds = new Set(existingCriterions.map((c) => c._id.toString()));

    const newLevels = levels.filter((l) => !l._id);
    const updatedLevels = levels.filter((l) => l._id && existingLevelIds.has(l._id));
    const keptLevelIds = new Set(levels.filter((l) => l._id).map((l) => l._id as string));
    const deletedLevels = existingLevels.filter((l) => !keptLevelIds.has(l._id.toString()));

    const newCriterions = criterions.filter((c) => !c._id);
    const updatedCriterions = criterions.filter((c) => c._id && existingCriterionIds.has(c._id));
    const keptCriterionIds = new Set(criterions.filter((c) => c._id).map((c) => c._id as string));
    const deletedCriterions = existingCriterions.filter((c) => !keptCriterionIds.has(c._id.toString()));

    await Promise.all([
      this.rubricLevelModel.insertMany(newLevels.map(({ _id, ...level }) => ({ ...level, rubricId }))),
      this.rubricCriterionModel.insertMany(
        newCriterions.map(({ _id, levelId, ...criterion }) => ({
          ...criterion,
          rubricId,
          levelId: levelId ? convertStringToObjectId(levelId) : null,
        })),
      ),
      ...updatedLevels.map(({ _id, ...level }) =>
        this.rubricLevelModel.updateOne({ _id: convertStringToObjectId(_id as string), rubricId }, { $set: level }),
      ),
      ...updatedCriterions.map((criterionDto) => {
        const { _id, levelId, ...criterion } = criterionDto;
        const set: Record<string, any> = { ...criterion };
        // Distinguish "omitted" (leave levelId untouched) from an explicit value
        // — including null, which detaches the criterion from its level.
        if ('levelId' in criterionDto) {
          set.levelId = levelId ? convertStringToObjectId(levelId) : null;
        }
        return this.rubricCriterionModel.updateOne(
          { _id: convertStringToObjectId(_id as string), rubricId },
          { $set: set },
        );
      }),
      this.rubricLevelModel.deleteMany({ _id: { $in: deletedLevels.map((l) => l._id) } }),
      this.rubricCriterionModel.deleteMany({ _id: { $in: deletedCriterions.map((c) => c._id) } }),
    ]);

    return this.getRubric(id);
  }

  async deleteRubric(userId: string, id: string) {
    const rubricId = convertStringToObjectId(id);
    const deleted = await this.rubricModel.findOneAndDelete({ _id: rubricId, userId: convertStringToObjectId(userId) });
    if (!deleted) throw new NotFoundException('Không tìm thấy rubric');
    await Promise.all([
      this.rubricLevelModel.deleteMany({ rubricId }),
      this.rubricCriterionModel.deleteMany({ rubricId }),
    ]);
    return { deleted: true };
  }

  async listRubricGroups(userId: string) {
    return this.rubricGroupModel.aggregate([
      { $match: { userId: convertStringToObjectId(userId) } },
      {
        $lookup: {
          from: 'rubrics',
          localField: '_id',
          foreignField: 'groupId',
          as: 'rubrics',
        },
      },
      { $addFields: { numberOfRubrics: { $size: '$rubrics' } } },
      { $project: { rubrics: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async createRubricGroup(userId: string, dto: RubricGroupDto) {
    const group = await this.rubricGroupModel.create({ ...dto, userId: convertStringToObjectId(userId) });
    return group.toObject();
  }

  async updateRubricGroup(userId: string, groupId: string, dto: RubricGroupDto) {
    const group = await this.rubricGroupModel
      .findOneAndUpdate(
        { _id: convertStringToObjectId(groupId), userId: convertStringToObjectId(userId) },
        dto,
        { new: true },
      )
      .lean();
    if (!group) throw new NotFoundException('Không tìm thấy nhóm rubric');
    return group;
  }

  async deleteRubricGroup(userId: string, groupId: string) {
    const ownerId = convertStringToObjectId(userId);
    const groupObjectId = convertStringToObjectId(groupId);
    const res = await this.rubricGroupModel.deleteOne({ _id: groupObjectId, userId: ownerId });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy nhóm rubric');
    await this.rubricModel.updateMany({ userId: ownerId, groupId: groupObjectId }, { groupId: null });
    return { deleted: true };
  }
}
