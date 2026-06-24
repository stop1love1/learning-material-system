'use client';
// Live loader: DB.ADMIN_USERS ← GET /users (admin-only; 401/403 swallowed).

import { DB } from '@/app/data/db';
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

export async function loadUsers(): Promise<void> {
  try {
    const res: any = await usersApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    // Surface the real user total (pagination envelope) into the admin KPI so
    // the "Người dùng" tile/card no longer show the mock 2480.
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
    // API down / not admin (401/403) → leave DB.ADMIN_USERS unchanged.
    return;
  }
}
