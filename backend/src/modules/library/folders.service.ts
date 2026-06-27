import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Folder } from '../../schemas/library/folder.schema';
import { FileItem } from '../../schemas/library/file.schema';
import { convertStringToObjectId } from '../../common/utils';
import { UserRole } from '../../enums';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ListFoldersDto } from './dto/list-folders.dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(FileItem.name) private readonly fileModel: Model<FileItem>,
  ) {}

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

  private assertOwnerOrAdmin(folder: { userId: any }, userId: string, role?: UserRole) {
    if (role === UserRole.Admin) return;
    if (folder.userId?.toString() !== convertStringToObjectId(userId).toString()) {
      throw new ForbiddenException('Bạn không có quyền với thư mục này');
    }
  }

  async update(id: string, dto: UpdateFolderDto, userId: string, role?: UserRole) {
    const patch: Record<string, any> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.parentId !== undefined) patch.parentId = dto.parentId ? convertStringToObjectId(dto.parentId) : null;
    if (dto.isPublic !== undefined) patch.isPublic = dto.isPublic;

    // findByIdAndUpdate bypasses the pre('save') ancestors/depth hook; load + save
    // the document so the hierarchy stays consistent when parentId changes.
    const folder = await this.folderModel.findById(convertStringToObjectId(id));
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục');
    this.assertOwnerOrAdmin(folder, userId, role);
    Object.assign(folder, patch);
    await folder.save();
    return folder.toObject();
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const folder = await this.folderModel.findById(convertStringToObjectId(id));
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục');
    this.assertOwnerOrAdmin(folder, userId, role);

    // Không cho xoá thư mục còn nội dung (thư mục con hoặc tệp) để tránh mồ côi dữ liệu.
    const [childFolder, childFile] = await Promise.all([
      this.folderModel.exists({ parentId: folder._id }),
      this.fileModel.exists({ folderId: folder._id }),
    ]);
    if (childFolder || childFile) {
      throw new ConflictException(
        'Thư mục không rỗng — hãy xoá hoặc di chuyển nội dung bên trong trước.',
      );
    }

    await folder.deleteOne();
    return { deleted: true };
  }
}
