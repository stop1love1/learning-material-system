import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileItem } from '../../schemas/library/file.schema';
import { Download } from '../../schemas/library/download.schema';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
import { DownloadKind } from '../../enums';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { ListFilesDto } from './dto/list-files.dto';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
    @InjectModel(Download.name) private readonly downloadModel: Model<Download>,
  ) {}

  async list(dto: ListFilesDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const query: Record<string, any> = {
      ...(keyword
        ? { $or: [{ name: { $regex: keyword, $options: 'i' } }, { tags: { $regex: keyword, $options: 'i' } }] }
        : {}),
      ...(dto.folderId ? { folderId: convertStringToObjectId(dto.folderId) } : {}),
      ...(dto.category ? { tags: dto.category } : {}),
      ...(dto.subject ? { subject: dto.subject } : {}),
      ...(dto.grade ? { grade: dto.grade } : {}),
    };
    const [records, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.fileModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findOne(id: string) {
    const file = await this.fileModel
      .findByIdAndUpdate(convertStringToObjectId(id), { $inc: { viewCount: 1 } }, { new: true })
      .lean();
    if (!file) throw new NotFoundException('Không tìm thấy tài liệu');
    return file;
  }

  async create(dto: CreateFileDto, userId: string) {
    const file = await this.fileModel.create({
      ...dto,
      folderId: dto.folderId ? convertStringToObjectId(dto.folderId) : null,
      userId: convertStringToObjectId(userId),
    });
    return file.toObject();
  }

  async update(id: string, dto: UpdateFileDto) {
    const patch: Record<string, any> = { ...dto };
    if (dto.folderId !== undefined) patch.folderId = dto.folderId ? convertStringToObjectId(dto.folderId) : null;
    const file = await this.fileModel.findByIdAndUpdate(convertStringToObjectId(id), patch, { new: true }).lean();
    if (!file) throw new NotFoundException('Không tìm thấy tài liệu');
    return file;
  }

  async remove(id: string) {
    const res = await this.fileModel.deleteOne({ _id: convertStringToObjectId(id) });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy tài liệu');
    return { deleted: true };
  }

  async download(id: string, userId: string) {
    const fileId = convertStringToObjectId(id);
    const file = await this.fileModel.findByIdAndUpdate(fileId, { $inc: { downloadCount: 1 } }, { new: true }).lean();
    if (!file) throw new NotFoundException('Không tìm thấy tài liệu');
    await this.downloadModel.updateOne(
      { userId: convertStringToObjectId(userId), fileId, kind: DownloadKind.Download },
      { $setOnInsert: { userId: convertStringToObjectId(userId), fileId, kind: DownloadKind.Download } },
      { upsert: true },
    );
    return { ok: true };
  }

  async myDownloads(userId: string) {
    const downloads = await this.downloadModel
      .find({ userId: convertStringToObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
    const fileIds = downloads.map((d) => d.fileId);
    return this.fileModel.find({ _id: { $in: fileIds } }).lean();
  }
}
