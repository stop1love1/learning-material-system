'use client';

import { DB } from '@/app/store/store';
import { usersApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

// Hai vai trò: admin = 'Quản trị viên', còn lại = 'Người dùng'.
const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  student: 'Người dùng',
};

/** Map /users record → admin table row (shared by loader + paged hook). */
export function mapUser(u: Record<string, any>): Record<string, any> {
  return {
    id: u._id || u.id,
    name: u.name,
    email: u.email,
    rawRole: u.role || 'student',
    role: ROLE_LABELS[u.role] ?? 'Người dùng',
    joined: formatDateVi(u.createdAt),
    status: u.status || 'active',
  };
}

export async function loadUsers(): Promise<void> {
  try {
    const res: any = await usersApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    const total = typeof (res as any)?.total === 'number' ? (res as any).total : records.length;
    DB.ADMIN_STATS.users = total;

    DB.ADMIN_USERS = records.map((u: Record<string, any>) => ({
      name: u.name,
      role: ROLE_LABELS[u.role] ?? 'Người dùng',
      email: u.email,
      joined: formatDateVi(u.createdAt),
      status: u.status,
    }));
  } catch {
    DB.ADMIN_USERS = [];
  }
}
