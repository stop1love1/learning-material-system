import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Đánh dấu endpoint không cần đăng nhập (bỏ qua JwtAuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
