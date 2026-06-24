import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { buildPagination, convertStringToObjectId, getPagination } from '../../common/utils';
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
    const query: Record<string, any> = {
      ...(keyword
        ? { $or: [{ name: { $regex: keyword, $options: 'i' } }, { email: { $regex: keyword, $options: 'i' } }] }
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

  async update(id: string, dto: UpdateUserDto) {
    const patch: Record<string, unknown> = { ...dto };
    if (dto.email) patch.email = dto.email.toLowerCase();
    if (dto.password) patch.password = await this.bcrypt.hash(dto.password);
    const user = await this.userModel
      .findByIdAndUpdate(convertStringToObjectId(id), patch, { new: true })
      .lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async remove(id: string) {
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
    });
    this.logger.log(`Đã tạo admin: ${email}`);
  }
}
