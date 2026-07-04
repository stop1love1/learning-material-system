'use client';
import { DB } from '@/app/store/store';
import { notificationsApi } from '@/app/lib/api';

export async function loadNotifications(): Promise<void> {
  try {
    const items: any[] = await notificationsApi.list(200);
    DB.NOTICES = (Array.isArray(items) ? items : []).map((n) => ({
      id: n.id,
      title: n.title,
      time: n.time,
      at: n.at,
      tag: n.tag,
      icon: n.icon,
    }));
  } catch {
    DB.NOTICES = [];
  }
}
