'use client';

import { DB } from '@/app/store/store';
import { usersApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

// Keep the admin screen's two-bucket model: it hardcodes only 'Người dùng' /
// 'Quản trị viên' in its filter pills, count cards and role colors. Teacher +
// student both map to 'Người dùng' so they stay visible under that filter.
const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Người dùng',
  student: 'Người dùng',
};

/**
 * Map one /users record into the admin table row shape (id/name/email/rawRole/
 * role label/joined/status). Shared by the paged users list hook and the loader.
 */
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

    // Surface real user total from pagination envelope into admin KPI.
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
