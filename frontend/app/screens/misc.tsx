'use client';
// misc.tsx — small standalone screens that lived in app.jsx: notifications + the
// account/settings page.
import React from 'react';
import type { Palette, Tweaks } from '@/app/types';
import { FONTS } from '@/app/theme/fonts';
import { Icon, Avatar, Btn, Field } from '@/app/components/ui';
import { DB } from '@/app/data/db';
import { useLMS } from '@/app/store/store';
import { authApi } from '@/app/lib/api';
import { ToggleRow, lblStyle } from '@/app/helpers/shared';

export function NotifyScreen({ p }: { p: Palette; t?: Tweaks }) {
  useLMS(); // re-render khi load-notifications cập nhật DB.NOTICES
  const items: any[] = DB.NOTICES || [];
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 8 }}>
        {items.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13.5, color: p.faint }}>Chưa có hoạt động nào.</div>
        )}
        {items.map((n: any, i: number) => (
          <div key={i} className="lms-row" style={{ display: 'flex', gap: 14, padding: '15px 16px', borderRadius: 12, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={n.icon} size={18} stroke={p.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: p.ink, lineHeight: 1.4 }}>{n.title}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 4 }}>
                {n.time} · {n.tag}
              </div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: i < 2 ? p.accent : 'transparent', marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const ROLE_VI: Record<string, string> = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

export function SettingsScreen({ p, t }: { p: Palette; t: Tweaks }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const card = { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 24, marginBottom: 20 };
  // Hồ sơ thật từ phiên đăng nhập (/auth/me) thay vì thông tin fix cứng.
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
    <div style={{ padding: '24px 30px 40px', maxWidth: 760, margin: '0 auto' }}>
      <section style={card}>
        <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 18px', color: p.ink }}>Hồ sơ</h3>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={lblStyle(p)}>HỌ TÊN</label><Field p={p} value={form.name} onChange={(v) => setForm((o) => ({ ...o, name: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>EMAIL</label><Field p={p} value={form.email} onChange={(v) => setForm((o) => ({ ...o, email: v }))} mono style={{ marginTop: 8 }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn p={p} variant="ghost" onClick={() => setEditing(false)}>Huỷ</Btn>
              <Btn p={p} icon="check" onClick={saveProfile}>{savingP ? 'Đang lưu…' : 'Lưu hồ sơ'}</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={profName} p={p} size={60} accent />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: p.ink }}>{profName}</div>
              <div style={{ fontSize: 13, color: p.faint, marginTop: 2 }}>{profEmail}{profRole ? ' · ' + profRole : ''}</div>
            </div>
            <Btn p={p} variant="ghost" icon="pen" onClick={startEdit}>Chỉnh sửa</Btn>
          </div>
        )}
      </section>
      <section style={card}>
        <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 14px', color: p.ink }}>Tuỳ chọn</h3>
        {['Nhận email khi học viên nộp bài', 'Nhắc nhở bài chưa chấm hằng ngày', 'Cho phép học viên xem điểm ngay'].map((lab, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <ToggleRow p={p} label={lab} def={i !== 2} />
          </div>
        ))}
      </section>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, textAlign: 'center' }}>
        Mẹo: bật <strong style={{ color: p.sub }}>Tweaks</strong> trên thanh công cụ để đổi màu, font, bố cục và các biến thể.
      </div>
    </div>
  );
}
