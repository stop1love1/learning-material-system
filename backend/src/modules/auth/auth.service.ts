import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { BcryptService } from '../../global/bcrypt.service';
import { JwtService } from '../../global/jwt.service';
import { UserRole, UserStatus } from '../../enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly bcrypt: BcryptService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const password = await this.bcrypt.hash(dto.password);
    const user = await this.userModel.create({
      name: dto.name,
      email,
      password,
      role: UserRole.Student,
      status: UserStatus.Active,
    });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).select('+password');
    if (!user || !user.password || !(await this.bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    user.lastActiveAt = new Date();
    await user.save();
    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private issue(user: UserDocument) {
    const accessToken = this.jwt.sign({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });
    return { accessToken, user: this.sanitize(user) };
  }

  private sanitize(user: UserDocument) {
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.password;
    return obj;
  }
}
