'use client';
// misc.tsx — small standalone screens that lived in app.jsx: notifications + the
// account/settings page.
import React from 'react';
import type { Palette, Tweaks } from '@/app/types';
import { FONTS } from '@/app/theme/fonts';
import { Icon, Avatar, Btn } from '@/app/components/ui';
import { DB } from '@/app/data/db';
import { ToggleRow } from '@/app/helpers/shared';

export function NotifyScreen({ p }: { p: Palette; t?: Tweaks }) {
  const items = [
    ...DB.NOTICES,
    { title: 'Phạm Quốc Bảo chưa hoàn thành 2 bài luyện tập', time: '2 giờ trước', tag: 'Nhắc nhở', icon: 'clock' },
    { title: 'Rubric “Tập làm văn” đã được cập nhật', time: 'Hôm qua', tag: 'Hệ thống', icon: 'rubric' },
  ];
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 8 }}>
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

export function SettingsScreen({ p, t }: { p: Palette; t: Tweaks }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const card = { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 24, marginBottom: 20 };
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 760, margin: '0 auto' }}>
      <section style={card}>
        <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 18px', color: p.ink }}>Hồ sơ</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name="Mai Anh" p={p} size={60} accent />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: p.ink }}>Cô Mai Anh</div>
            <div style={{ fontSize: 13, color: p.faint, marginTop: 2 }}>maianh@vuonvan.vn · Giáo viên Tiểu học</div>
          </div>
          <Btn p={p} variant="ghost" icon="pen">
            Chỉnh sửa
          </Btn>
        </div>
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
