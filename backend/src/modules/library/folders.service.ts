import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from '../../schemas/library/folder.schema';
import { convertStringToObjectId } from '../../common/utils';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ListFoldersDto } from './dto/list-folders.dto';

@Injectable()
export class FoldersService {
  constructor(@InjectModel(Folder.name) private readonly folderModel: Model<Folder>) {}

  async list(dto: ListFoldersDto) {
    const query: Record<string, any> = {
      parentId: dto.parentId ? convertStringToObjectId(dto.parentId) : null,
    };
    return this.folderModel.find(query).sort({ name: 1 }).lean();
  }

  async create(dto: CreateFolderDto, userId: string) {
    const folder = await this.folderModel.create({
      name: dto.name,
      parentId: dto.parentId ? convertStringToObjectId(dto.parentId) : null,
      ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      userId: convertStringToObjectId(userId),
    });
    return folder.toObject();
  }

  async update(id: string, dto: UpdateFolderDto) {
    const patch: Record<string, any> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.parentId !== undefined) patch.parentId = dto.parentId ? convertStringToObjectId(dto.parentId) : null;
    if (dto.isPublic !== undefined) patch.isPublic = dto.isPublic;

    // findByIdAndUpdate bypasses the pre('save') ancestors/depth hook; load + save
    // the document so the hierarchy stays consistent when parentId changes.
    const folder = await this.folderModel.findById(convertStringToObjectId(id));
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục');
    Object.assign(folder, patch);
    await folder.save();
    return folder.toObject();
  }

  async remove(id: string) {
    const res = await this.folderModel.deleteOne({ _id: convertStringToObjectId(id) });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy thư mục');
    return { deleted: true };
  }
}
