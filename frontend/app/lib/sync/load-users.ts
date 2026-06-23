'use client';
// Live loader: DB.ADMIN_USERS ← GET /users (admin-only; 401/403 swallowed).

import { DB } from '@/app/data/db';
import { usersApi } from '@/app/lib/api';

export async function loadUsers(): Promise<void> {
  try {
    const res: any = await usersApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    DB.ADMIN_USERS = records.map((u: Record<string, any>) => ({
      name: u.name,
      role: u.role === 'admin' ? 'Quản trị viên' : 'Người dùng',
      email: u.email,
      joined: u.createdAt ?? '',
      done: 0,
      status: u.status,
    }));
  } catch {
    // API down / not admin (401/403) → leave DB.ADMIN_USERS unchanged.
    return;
  }
}
