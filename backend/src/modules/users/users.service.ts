import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { UserRole, UserStatus } from '../../enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly bcrypt: BcryptService,
  ) {}

  async list(dto: ListUsersDto) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const safeKeyword = parseKeyword(keyword);
    const query: Record<string, any> = {
      ...(safeKeyword
        ? {
            $or: [
              { name: { $regex: safeKeyword, $options: 'i' } },
              { email: { $regex: safeKeyword, $options: 'i' } },
            ],
          }
        : {}),
      ...(dto.role ? { role: dto.role } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    };
    const [records, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.userModel.countDocuments(query),
    ]);
    return buildPagination(records, total, page, pageSize);
  }

  async findById(id: string) {
    const user = await this.userModel.findById(convertStringToObjectId(id)).lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    if (await this.userModel.exists({ email })) throw new ConflictException('Email đã tồn tại');
    const password = await this.bcrypt.hash(dto.password);
    const user = await this.userModel.create({ ...dto, email, password });
    return this.findById(user._id.toString());
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string) {
    // Admin must not lock or demote their own account.
    if (currentUserId && currentUserId === id) {
      if (dto.role !== undefined && dto.role !== UserRole.Admin) {
        throw new ForbiddenException('Không thể tự hạ quyền tài khoản của chính mình');
      }
      if (dto.status !== undefined && dto.status !== UserStatus.Active) {
        throw new ForbiddenException('Không thể tự khóa tài khoản của chính mình');
      }
    }

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.email !== undefined) patch.email = dto.email.toLowerCase();
    if (dto.password !== undefined) patch.password = await this.bcrypt.hash(dto.password);

    const user = await this.userModel
      .findByIdAndUpdate(convertStringToObjectId(id), patch, { new: true })
      .lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async remove(id: string, currentUserId?: string) {
    if (currentUserId && currentUserId === id) {
      throw new ForbiddenException('Không thể tự xóa tài khoản của chính mình');
    }
    // Never remove the final Admin account.
    const target = await this.userModel.findById(convertStringToObjectId(id)).select('role').lean();
    if (!target) throw new NotFoundException('Không tìm thấy người dùng');
    if (target.role === UserRole.Admin) {
      const adminCount = await this.userModel.countDocuments({ role: UserRole.Admin });
      if (adminCount <= 1) {
        throw new ForbiddenException('Không thể xóa Admin cuối cùng của hệ thống');
      }
    }
    const res = await this.userModel.deleteOne({ _id: convertStringToObjectId(id) });
    if (res.deletedCount === 0) throw new NotFoundException('Không tìm thấy người dùng');
    return { deleted: true };
  }

  async seedAdmin() {
    const email = (process.env.ADMIN_EMAIL ?? 'admin@vuonvan.vn').toLowerCase();
    if (await this.userModel.exists({ email })) {
      this.logger.log(`Admin "${email}" đã tồn tại — bỏ qua.`);
      return;
    }
    const password = await this.bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123456');
    await this.userModel.create({
      name: 'Quản trị viên',
      email,
      password,
      role: UserRole.Admin,
      status: UserStatus.Active,
      emailVerified: true,
      provider: 'local',
    });
    this.logger.log(`Đã tạo admin: ${email}`);
  }
}
