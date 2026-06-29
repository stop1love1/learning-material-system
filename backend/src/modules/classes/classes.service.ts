import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class } from '../../schemas/class/class.schema';
import { Enrollment } from '../../schemas/class/enrollment.schema';
import { User } from '../../schemas/user.schema';
import { Exercise } from '../../schemas/exercise/exercise.schema';
import { buildPagination, convertStringToObjectId, getPagination, parseKeyword } from '../../common/utils';
import { EnrollmentStatus, UserRole } from '../../enums';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { JoinClassDto } from './dto/join-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<Class>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<Enrollment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
  ) {}

  private isPrivileged(role?: UserRole): boolean {
    return role === UserRole.Admin || role === UserRole.Teacher;
  }

  /** Ids các lớp mà học viên đang ghi danh Active. */
  private async activeClassIds(userId: string): Promise<Types.ObjectId[]> {
    const rows = await this.enrollmentModel
      .find({ studentId: convertStringToObjectId(userId), status: EnrollmentStatus.Active })
      .select('classId')
      .lean();
    return rows.map((r) => r.classId);
  }

  async list(dto: ListClassesDto, userId: string, role?: UserRole) {
    const { keyword, page, pageSize } = getPagination(dto.keyword, dto.page, dto.pageSize);
    const safeKeyword = parseKeyword(keyword);
    const query: Record<string, any> = {
      ...(safeKeyword
        ? {
            $or: [
              { name: { $regex: safeKeyword, $options: 'i' } },
              { description: { $regex: safeKeyword, $options: 'i' } },
            ],
          }
        : {}),
      ...(dto.grade ? { grade: dto.grade } : {}),
    };

    // Owner scoping: Admin → tất cả; Teacher → lớp của mình; Student → lớp đang ghi danh Active.
    if (role === UserRole.Admin) {
      // no extra filter
    } else if (role === UserRole.Teacher) {
      query.ownerId = convertStringToObjectId(userId);
    } else {
      const ids = await this.activeClassIds(userId);
      query._id = { $in: ids };
    }

    const [records, total] = await Promise.all([
      this.classModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.classModel.countDocuments(query),
    ]);

    // Đính số học viên đang Active cho mỗi lớp (một aggregation, không N+1).
    const ids = records.map((r: any) => r._id);
    const counts = await this.enrollmentModel.aggregate([
      { $match: { classId: { $in: ids }, status: EnrollmentStatus.Active } },
      { $group: { _id: '$classId', n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: any) => [c._id.toString(), c.n]));
    const withCount = records.map((r: any) => ({
      ...r,
      studentCount: countMap.get(r._id.toString()) ?? 0,
    }));

    return buildPagination(withCount, total, page, pageSize);
  }

  /** Lấy lớp + kiểm tra quyền xem (owner/Admin/học viên đang ghi danh). */
  async findById(id: string, userId: string, role?: UserRole) {
    const classId = convertStringToObjectId(id);
    const klass = await this.classModel.findById(classId).lean();
    if (!klass) throw new NotFoundException('Không tìm thấy lớp học');

    const isOwner = klass.ownerId?.toString() === userId;
    if (role !== UserRole.Admin && !isOwner) {
      const enrolled = await this.enrollmentModel.exists({
        classId,
        studentId: convertStringToObjectId(userId),
        status: EnrollmentStatus.Active,
      });
      if (!enrolled) throw new ForbiddenException('Không có quyền xem lớp học này');
    }

    const studentCount = await this.enrollmentModel.countDocuments({
      classId,
      status: EnrollmentStatus.Active,
    });
    return { ...klass, studentCount };
  }

  async create(dto: CreateClassDto, userId: string) {
    const code = dto.code?.trim();
    if (code && (await this.classModel.exists({ code }))) {
      throw new ConflictException('Mã lớp đã tồn tại');
    }
    const klass = await this.classModel.create({
      name: dto.name,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.grade !== undefined ? { grade: dto.grade } : {}),
      ...(code ? { code } : {}),
      ownerId: convertStringToObjectId(userId),
    });
    return klass.toObject();
  }

  /** Filter giới hạn theo chủ sở hữu (Admin bỏ qua). */
  private ownerFilter(id: string, userId: string, role?: UserRole): Record<string, any> {
    const owner = role === UserRole.Admin ? {} : { ownerId: convertStringToObjectId(userId) };
    return { _id: convertStringToObjectId(id), ...owner };
  }

  async update(id: string, dto: UpdateClassDto, userId: string, role?: UserRole) {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.grade !== undefined) patch.grade = dto.grade;
    if (dto.isArchived !== undefined) patch.isArchived = dto.isArchived;
    if (dto.code !== undefined) {
      const code = dto.code?.trim();
      if (code) {
        const clash = await this.classModel.exists({
          code,
          _id: { $ne: convertStringToObjectId(id) },
        });
        if (clash) throw new ConflictException('Mã lớp đã tồn tại');
        patch.code = code;
      } else {
        patch.code = null;
      }
    }

    const klass = await this.classModel
      .findOneAndUpdate(this.ownerFilter(id, userId, role), patch, { new: true })
      .lean();
    if (!klass) throw new NotFoundException('Không tìm thấy lớp học');
    return klass;
  }

  async remove(id: string, userId: string, role?: UserRole) {
    const classId = convertStringToObjectId(id);
    // Phải xác nhận quyền sở hữu TRƯỚC khi cascade.
    const klass = await this.classModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!klass) throw new NotFoundException('Không tìm thấy lớp học');

    await this.classModel.deleteOne({ _id: classId });
    // Cascade: xóa ghi danh + gỡ liên kết classId trên các bài tập của lớp.
    await Promise.all([
      this.enrollmentModel.deleteMany({ classId }),
      this.exerciseModel.updateMany({ classId }, { $set: { classId: null } }),
    ]);
    return { deleted: true };
  }

  /** Bảo đảm caller là chủ lớp (hoặc Admin); trả về lớp. */
  private async assertManageable(id: string, userId: string, role?: UserRole) {
    const klass = await this.classModel.findOne(this.ownerFilter(id, userId, role)).lean();
    if (!klass) throw new NotFoundException('Không tìm thấy lớp học');
    return klass;
  }

  async listStudents(id: string, userId: string, role?: UserRole) {
    await this.assertManageable(id, userId, role);
    const classId = convertStringToObjectId(id);
    const enrollments = await this.enrollmentModel
      .find({ classId, status: EnrollmentStatus.Active })
      .sort({ joinedAt: -1 })
      .lean();
    const studentIds = enrollments.map((e) => e.studentId);
    const users = await this.userModel
      .find({ _id: { $in: studentIds } })
      .select('name email avatar role status')
      .lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
    return enrollments.map((e: any) => ({
      enrollmentId: e._id,
      classId: e.classId,
      studentId: e.studentId,
      status: e.status,
      joinedAt: e.joinedAt,
      student: userMap.get(e.studentId.toString()) ?? null,
    }));
  }

  async addStudents(id: string, dto: AddStudentsDto, userId: string, role?: UserRole) {
    await this.assertManageable(id, userId, role);
    const classId = convertStringToObjectId(id);
    // Idempotent upsert: tạo mới hoặc kích hoạt lại bản ghi đã Removed.
    const now = new Date();
    await Promise.all(
      dto.studentIds.map((sid) => {
        const studentId = convertStringToObjectId(sid);
        return this.enrollmentModel.updateOne(
          { classId, studentId },
          {
            $set: { status: EnrollmentStatus.Active },
            $setOnInsert: { classId, studentId, joinedAt: now },
          },
          { upsert: true },
        );
      }),
    );
    const activeCount = await this.enrollmentModel.countDocuments({
      classId,
      status: EnrollmentStatus.Active,
    });
    return { added: dto.studentIds.length, activeCount };
  }

  async removeStudent(id: string, studentId: string, userId: string, role?: UserRole) {
    await this.assertManageable(id, userId, role);
    const classId = convertStringToObjectId(id);
    const res = await this.enrollmentModel.updateOne(
      { classId, studentId: convertStringToObjectId(studentId) },
      { $set: { status: EnrollmentStatus.Removed } },
    );
    if (res.matchedCount === 0) {
      throw new NotFoundException('Không tìm thấy học viên trong lớp');
    }
    return { removed: true };
  }

  async join(dto: JoinClassDto, userId: string) {
    const code = dto.code?.trim();
    if (!code) throw new NotFoundException('Mã lớp không hợp lệ');
    const klass = await this.classModel.findOne({ code }).lean();
    if (!klass) throw new NotFoundException('Không tìm thấy lớp với mã này');
    if (klass.isArchived) throw new ForbiddenException('Lớp học đã đóng');

    const classId = klass._id;
    const studentId = convertStringToObjectId(userId);
    await this.enrollmentModel.updateOne(
      { classId, studentId },
      {
        $set: { status: EnrollmentStatus.Active },
        $setOnInsert: { classId, studentId, joinedAt: new Date() },
      },
      { upsert: true },
    );
    return { joined: true, classId, name: klass.name };
  }
}
