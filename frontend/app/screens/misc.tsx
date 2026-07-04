'use client';
import React from 'react';
import type { Palette, Tweaks } from '@/app/types';
import { Icon, Avatar, Btn, Field, Pill, Tag } from '@/app/components/ui';
import { Pagination } from '@/app/components/Pagination';
import { DB } from '@/app/store/store';
import { useLMS } from '@/app/store/store';
import { authApi } from '@/app/lib/api';
import { toastSuccess, toastError } from '@/app/lib/ui/dialogs';
import { lblClass, cardClass } from '@/app/helpers/shared';

const NOTIFY_TAG_COLOR = (p: Palette, tag: string): string => {
  switch (tag) {
    case 'Chấm điểm': return p.warn;
    case 'Bài tập': return p.accent;
    case 'Bài viết': return p.ok;
    case 'Học liệu': return p.accent;
    case 'Người dùng': return p.sub;
    default: return p.sub;
  }
};

export function NotifyScreen({ p }: { p: Palette; t?: Tweaks }) {
  useLMS();
  const all: any[] = DB.NOTICES || [];
  const [kw, setKw] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const tags = React.useMemo(() => Array.from(new Set(all.map((n) => n.tag).filter(Boolean))), [all]);
  const k = kw.trim().toLowerCase();
  const filtered = React.useMemo(
    () => all.filter((n) => (!tag || n.tag === tag) && (!k || (n.title || '').toLowerCase().includes(k))),
    [all, tag, k],
  );
  React.useEffect(() => { setPage(1); }, [tag, k]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const pageItems = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="lms-content-pad mx-auto max-w-[900px] px-[30px] pt-6 pb-10">
      <div className="mb-[18px]">
        <h2 className="m-0 font-lms-heading text-[22px] font-bold text-lms-ink">Nhật ký & thông báo</h2>
        <p className="mt-1 text-[13px] text-lms-sub">Tổng hợp hoạt động gần đây trong hệ thống · {filtered.length} mục</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Field p={p} icon="search" value={kw} onChange={setKw} placeholder="Tìm hoạt động…" className="w-[260px] max-sm:w-full" />
        <div className="flex flex-wrap gap-1.5">
          <Pill p={p} active={tag === ''} onClick={() => setTag('')}>Tất cả</Pill>
          {tags.map((tg) => <Pill key={tg} p={p} active={tag === tg} onClick={() => setTag(tg)}>{tg}</Pill>)}
        </div>
      </div>
      <div className={`${cardClass(16)} p-2!`}>
        {pageItems.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13.5px] text-lms-faint">
            {all.length === 0 ? 'Chưa có hoạt động nào.' : 'Không có hoạt động phù hợp.'}
          </div>
        ) : (
          pageItems.map((n: any, i: number) => (
            <div key={n.id ?? i} className={`lms-row flex items-center gap-3.5 rounded-xl px-4 py-[13px] ${i ? 'border-t border-lms-line-soft' : ''}`}>
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-lms-accent-soft">
                <Icon name={n.icon || 'bell'} size={18} stroke={p.accent} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm leading-snug text-lms-ink">{n.title}</div>
                <div className="mt-1 font-mono text-[11px] text-lms-faint">{n.time}</div>
              </div>
              {n.tag && <Tag p={p} color={NOTIFY_TAG_COLOR(p, n.tag)}>{n.tag}</Tag>}
            </div>
          ))
        )}
      </div>
      {pages > 1 && (
        <Pagination current={cur} pages={pages} total={filtered.length} pageSize={pageSize} onChange={setPage} p={p} />
      )}
    </div>
  );
}

const ROLE_VI: Record<string, string> = { admin: 'Quản trị viên', student: 'Người dùng' };

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
      toastSuccess('Đã lưu hồ sơ.');
    } catch {
      toastError('Không thể lưu hồ sơ. Email có thể đã được dùng.');
    }
    setSavingP(false);
  };
  const profName = me?.name || 'Chưa đăng nhập';
  const profEmail = me?.email || '—';
  const profRole = ROLE_VI[me?.role] || '';
  return (
    <div className="lms-content-pad mx-auto max-w-[760px] px-[30px] pt-6 pb-10">
      <section className={`mb-5 ${cardClass(24)}`}>
        <h3 className="mb-[18px] mt-0 font-lms-heading text-[19px] font-medium text-lms-ink">Hồ sơ</h3>
        {editing ? (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
          { lab: 'Nhận email khi người dùng nộp bài', key: 'notify-submit', def: true },
          { lab: 'Nhắc nhở bài chưa chấm hằng ngày', key: 'remind-grading', def: true },
          { lab: 'Cho phép người dùng xem điểm ngay', key: 'show-score', def: false },
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
