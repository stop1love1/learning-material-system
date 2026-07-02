import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtService } from '../../global/jwt.service';
import { User } from '../../schemas/user.schema';

/**
 * Verify the Bearer token (signature + expiry) and attach the payload to
 * req.user. Endpoints marked @Public() skip the check.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization as string | undefined;
    if (!header) throw new UnauthorizedException('Missing access token');
    const payload = this.jwtService.verify(header);
    req.user = payload;

    // Vô hiệu hoá các token phát hành trước khi đổi mật khẩu (reset/rotation).
    if (payload?.sub && typeof payload.iat === 'number') {
      const user = await this.userModel
        .findById(payload.sub)
        .select('passwordChangedAt');
      if (user?.passwordChangedAt) {
        // iat tính theo giây; nới 1 giây để tránh loại nhầm token vừa phát hành.
        const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (payload.iat < changedAtSec) {
          throw new UnauthorizedException('Phiên đăng nhập đã hết hiệu lực');
        }
      }
    }

    return true;
  }
}
