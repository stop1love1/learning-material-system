import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../../schemas/article.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';

@Injectable()
export class ArticleService {
  constructor(@InjectModel(Article.name) private readonly articleModel: Model<Article>) {}

  async list(dto: ListArticlesDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      isPublished: true,
      ...(keyword
        ? { $or: [{ title: { $regex: keyword, $options: 'i' } }, { excerpt: { $regex: keyword, $options: 'i' } }] }
        : {}),
      ...(dto.category ? { category: dto.category } : {}),
    };
    const [records, total] = await Promise.all([
      this.articleModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.articleModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findById(id: string) {
    const article = await this.articleModel
      .findByIdAndUpdate(convertStringToObjectId(id), { $inc: { viewCount: 1 } }, { new: true })
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

  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.articleModel
      .findByIdAndUpdate(convertStringToObjectId(id), { ...dto }, { new: true })
      .lean();
    if (!article) throw new NotFoundException('Không tìm thấy bài viết');
    return article;
  }

  async remove(id: string) {
    const res = await this.articleModel.deleteOne({ _id: convertStringToObjectId(id) });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài viết');
    return { deleted: true };
  }
}
