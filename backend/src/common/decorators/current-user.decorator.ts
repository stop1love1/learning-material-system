import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types';

/** Lấy user (từ JWT) đã được JwtAuthGuard gắn vào req.user. */
export const CurrentUser = createParamDecorator((data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user as JwtPayload | undefined;
  return data ? user?.[data] : user;
});
