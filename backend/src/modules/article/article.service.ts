import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../../schemas/article.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { UserRole } from '../../enums';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';

@Injectable()
export class ArticleService {
  constructor(@InjectModel(Article.name) private readonly articleModel: Model<Article>) {}

  async list(dto: ListArticlesDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const safeKeyword = parseKeyword(keyword);
    const query: Record<string, any> = {
      isPublished: true,
      ...(safeKeyword
        ? {
            $or: [
              { title: { $regex: safeKeyword, $options: 'i' } },
              { excerpt: { $regex: safeKeyword, $options: 'i' } },
            ],
          }
        : {}),
      ...(dto.category ? { category: dto.category } : {}),
    };
    const [records, total] = await Promise.all([
      this.articleModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({ path: 'userId', select: 'name avatar' })
        .lean(),
      this.articleModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findById(id: string) {
    // Public route: only published articles are visible (no leaking of drafts).
    const article = await this.articleModel
      .findOneAndUpdate(
        { _id: convertStringToObjectId(id), isPublished: true },
        { $inc: { viewCount: 1 } },
        { new: true },
      )
      .populate({ path: 'userId', select: 'name avatar' })
      .lean();
    if (!article) throw new NotFoundException('Không tìm thấy bài viết');
    return article;
  }

  async create(userId: string, dto: CreateArticleDto) {
    const article = await this.articleModel.create({
      ...dto,
      userId: convertStringToObjectId(userId),
    });
    const created = await this.articleModel.findById(article._id).lean();
    if (!created) throw new NotFoundException('Không tìm thấy bài viết');
    return created;
  }

  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { userId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  // Whitelist of fields a client may patch. Ownership (userId) and counters
  // (viewCount) are intentionally excluded so they can never be reassigned via
  // the request body, even if the DTO were widened later.
  private static readonly UPDATABLE_FIELDS = [
    'title',
    'slug',
    'excerpt',
    'content',
    'images',
    'category',
    'cover',
    'tags',
    'isPublished',
    'isFeatured',
    'readMinutes',
  ] as const;

  async update(id: string, dto: UpdateArticleDto, userId: string, role?: UserRole) {
    const patch: Record<string, any> = {};
    for (const key of ArticleService.UPDATABLE_FIELDS) {
      if (dto[key] !== undefined) patch[key] = dto[key];
    }
    const article = await this.articleModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), patch, { new: true })
      .lean();
    if (!article) throw new NotFoundException('Không tìm thấy bài viết');
    return article;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const res = await this.articleModel.deleteOne(this.ownerFilter(id, userId, role));
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài viết');
    return { deleted: true };
  }
}
