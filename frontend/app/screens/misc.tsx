'use client';
import React from 'react';
import type { Palette, Tweaks } from '@/app/types';
import { Icon, Avatar, Btn, Field } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { useLMS } from '@/app/store/store';
import { authApi } from '@/app/lib/api';
import { lblClass, cardClass } from '@/app/helpers/shared';

export function NotifyScreen({ p }: { p: Palette; t?: Tweaks }) {
  useLMS();
  const items: any[] = DB.NOTICES || [];
  return (
    <div className="mx-auto max-w-[760px] px-[30px] pt-6 pb-10">
      <div className={`${cardClass(16)} p-2!`}>
        {items.length === 0 && (
          <div className="px-4 py-7 text-center text-[13.5px] text-lms-faint">Chưa có hoạt động nào.</div>
        )}
        {items.map((n: any, i: number) => (
          <div key={i} className="lms-row flex cursor-pointer gap-3.5 rounded-xl px-4 py-[15px]">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-lms-accent-soft">
              <Icon name={n.icon} size={18} stroke={p.accent} />
            </div>
            <div className="flex-1">
              <div className="text-sm leading-snug text-lms-ink">{n.title}</div>
              <div className="mt-1 font-mono text-[11px] text-lms-faint">
                {n.time} · {n.tag}
              </div>
            </div>
            <div className={`mt-1.5 h-2 w-2 rounded ${i < 2 ? 'bg-lms-accent' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

const ROLE_VI: Record<string, string> = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

// Toggle tuỳ chọn cá nhân — lưu localStorage (prefs phía client, không có backend theo người dùng).
function PrefToggle({ p, label, prefKey, def }: { p: Palette; label: React.ReactNode; prefKey: string; def?: boolean }) {
  const storageKey = `lms-pref-${prefKey}`;
  const [on, setOn] = React.useState<boolean>(!!def);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try { const v = localStorage.getItem(storageKey); if (v != null) setOn(v === '1'); } catch {}
  }, [storageKey]);
  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch {}
      return next;
    });
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-lms-line bg-lms-raise px-3.5 py-[11px]">
      <span className="text-[13.5px] text-lms-ink">{label}</span>
      <div onClick={toggle} className={`flex h-6 w-[42px] cursor-pointer rounded-xl p-0.5 transition-colors ${on ? 'bg-lms-accent justify-end' : 'bg-lms-sink justify-start'}`}>
        <div className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]" />
      </div>
    </div>
  );
}

export function SettingsScreen({ p, t }: { p: Palette; t: Tweaks }) {
  const [me, setMe] = React.useState<any>(null);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '' });
  const [savingP, setSavingP] = React.useState(false);
  React.useEffect(() => { authApi.me().then(setMe).catch(() => {}); }, []);
  const startEdit = () => { setForm({ name: me?.name || '', email: me?.email || '' }); setEditing(true); };
  const saveProfile = async () => {
    setSavingP(true);
    try {
      const u = await authApi.updateMe({ name: form.name.trim(), email: form.email.trim() });
      setMe(u);
      setEditing(false);
    } catch {
      if (typeof window !== 'undefined') window.alert('Không thể lưu hồ sơ. Email có thể đã được dùng.');
    }
    setSavingP(false);
  };
  const profName = me?.name || 'Chưa đăng nhập';
  const profEmail = me?.email || '—';
  const profRole = ROLE_VI[me?.role] || '';
  return (
    <div className="mx-auto max-w-[760px] px-[30px] pt-6 pb-10">
      <section className={`mb-5 ${cardClass(24)}`}>
        <h3 className="mb-[18px] mt-0 font-lms-heading text-[19px] font-medium text-lms-ink">Hồ sơ</h3>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div><label className={lblClass()}>HỌ TÊN</label><Field p={p} value={form.name} onChange={(v) => setForm((o) => ({ ...o, name: v }))} className="mt-2" /></div>
              <div><label className={lblClass()}>EMAIL</label><Field p={p} value={form.email} onChange={(v) => setForm((o) => ({ ...o, email: v }))} mono className="mt-2" /></div>
            </div>
            <div className="flex justify-end gap-2.5">
              <Btn p={p} variant="ghost" onClick={() => setEditing(false)}>Huỷ</Btn>
              <Btn p={p} icon="check" onClick={saveProfile}>{savingP ? 'Đang lưu…' : 'Lưu hồ sơ'}</Btn>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar name={profName} p={p} size={60} accent />
            <div className="flex-1">
              <div className="text-base font-semibold text-lms-ink">{profName}</div>
              <div className="mt-0.5 text-[13px] text-lms-faint">{profEmail}{profRole ? ' · ' + profRole : ''}</div>
            </div>
            <Btn p={p} variant="ghost" icon="pen" onClick={startEdit}>Chỉnh sửa</Btn>
          </div>
        )}
      </section>
      <section className={`mb-5 ${cardClass(24)}`}>
        <h3 className="mb-3.5 mt-0 font-lms-heading text-[19px] font-medium text-lms-ink">Tuỳ chọn</h3>
        {[
          { lab: 'Nhận email khi học viên nộp bài', key: 'notify-submit', def: true },
          { lab: 'Nhắc nhở bài chưa chấm hằng ngày', key: 'remind-grading', def: true },
          { lab: 'Cho phép học viên xem điểm ngay', key: 'show-score', def: false },
        ].map((o) => (
          <div key={o.key} className="mb-2.5">
            <PrefToggle p={p} label={o.lab} prefKey={o.key} def={o.def} />
          </div>
        ))}
      </section>
      <div className="text-center font-mono text-[11px] text-lms-faint">
        Mẹo: bật <strong className="text-lms-sub">Tweaks</strong> trên thanh công cụ để đổi màu, font, bố cục và các biến thể.
      </div>
    </div>
  );
}
