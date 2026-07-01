'use client';
import { DB } from '@/app/store/store';
import { scheduleApi } from '@/app/lib/api';

export async function loadSchedule(): Promise<void> {
  try {
    const items: any[] = await scheduleApi.today();
    DB.SCHEDULE = (Array.isArray(items) ? items : []).map((s: Record<string, any>) => ({
      id: s._id,
      time: s.time ?? '',
      dur: s.duration ?? '',
      title: s.title ?? '',
      room: s.room ?? '',
      cls: s.classLabel ?? '',
    }));
  } catch {
    DB.SCHEDULE = [];
  }
}
