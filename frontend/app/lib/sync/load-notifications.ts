'use client';
import { DB } from '@/app/store/store';
import { notificationsApi } from '@/app/lib/api';

export async function loadNotifications(): Promise<void> {
  try {
    const items: any[] = await notificationsApi.list(20);
    DB.NOTICES = (Array.isArray(items) ? items : []).map((n) => ({ title: n.title, time: n.time, tag: n.tag, icon: n.icon }));
  } catch {
    DB.NOTICES = [];
  }
}
