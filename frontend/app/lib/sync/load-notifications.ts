'use client';
// Live loader: DB.NOTICES ← GET /notifications (computed activity feed).
import { DB } from '@/app/data/db';
import { notificationsApi } from '@/app/lib/api';

export async function loadNotifications(): Promise<void> {
  try {
    const items: any[] = await notificationsApi.list(20);
    if (Array.isArray(items) && items.length) {
      DB.NOTICES = items.map((n) => ({ title: n.title, time: n.time, tag: n.tag, icon: n.icon }));
    }
  } catch {
    return;
  }
}
