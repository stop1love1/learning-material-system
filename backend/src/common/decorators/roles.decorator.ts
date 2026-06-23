import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../enums';

export const ROLES_KEY = 'roles';

/** Giới hạn vai trò được phép gọi endpoint. Dùng kèm RolesGuard. */
export const Roles = (roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
