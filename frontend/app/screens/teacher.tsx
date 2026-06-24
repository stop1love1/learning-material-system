'use client';
import React from 'react';
import { Icon, Tag, Avatar, Btn, Field, Select, Progress, Segmented, Stat } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { tStripe, ACCENTS_REF } from '@/app/helpers/shared';
import { useLmsAuth } from '@/app/contexts/AuthProvider';

function tCard(p, pad = 22) {
  return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad };
}

function statusTone(p, s) {
  return { top: p.ok, good: p.info, risk: p.danger }[s] || p.sub;
}
function statusLabel(s) {
  return { top: 'Xuất sắc', good: 'Ổn định', risk: 'Cần hỗ trợ' }[s] || s;
}

// ── Teacher Overview ─────────────────────────────────────────────────────────
export function TOverview({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const auth = useLmsAuth();
  const ung = (aid) => DB.SUBMISSIONS.filter((s) => s.assignmentId === aid && s.status !== 'graded').length;
  const needGrading = DB.ASSIGNMENTS.filter((a) => ung(a.id) > 0);
  const shortcuts = [
    { icon: 'bank', label: 'Soạn câu hỏi', sub: 'Thêm vào ngân hàng', route: 'bank-edit' },
    { icon: 'docs', label: 'Tải tài liệu', sub: 'Lên kho học liệu', route: 'docs' },
    { icon: 'rubric', label: 'Tạo rubric', sub: 'Bộ tiêu chí mới', route: 'rubric-edit' },
    { icon: 'assign', label: 'Giao bài tập', sub: 'Phát cho lớp', route: 'assign-new' },
  ];
  return (
    <div style={{ padding: '30px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 26, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 1, color: p.faint, marginBottom: 10 }}>THỨ HAI · 22 THÁNG 6, 2026</div>
          <h2 style={{ fontFamily: serif, fontSize: 38, fontWeight: 500, color: p.ink, margin: 0, letterSpacing: -0.6, lineHeight: 1.05 }}>
            Chào buổi sáng, <span style={{ color: p.accent }}>{auth.name || 'bạn'}.</span>
          </h2>
          <p style={{ fontSize: 14.5, color: p.sub, margin: '12px 0 0', maxWidth: 520, lineHeight: 1.5 }}>
            Hôm nay có <strong style={{ color: p.ink }}>3 buổi dạy</strong> và <strong style={{ color: p.ink }}>19 bài tập</strong> đang chờ chấm. Cùng bắt đầu một ngày hiệu quả nhé!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
          <Btn p={p} variant="ghost" icon="book" onClick={() => setRoute('docs')}>Kho tài liệu</Btn>
        </div>
      </div>

      <div className="lms-statstrip" style={{ display: 'flex', ...tCard(p, 0), padding: '22px 0', marginBottom: 24 }}>
        {[
          { l: 'Học viên đang dạy', v: '95', d: '4 lớp', sp: [8, 10, 9, 12, 11, 14, 13, 16] },
          { l: 'Bài tập đang mở', v: '4', d: '2 sắp đến hạn', sp: [5, 6, 6, 7, 9, 8, 10, 11] },
          { l: 'Bài chờ chấm', v: '19', d: 'Cần xử lý', sp: [12, 9, 14, 11, 16, 13, 18, 19] },
          { l: 'Tỷ lệ nộp bài', v: '86', u: '%', d: '↑ 3,2%', up: true, sp: [7, 8, 8, 9, 9, 10, 11, 12] },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '0 26px', borderLeft: i ? `1px solid ${p.line}` : 'none' }}>
            <Stat p={p} label={s.l} value={s.v} unit={s.u} delta={s.d} up={s.up} spark={s.sp} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section style={tCard(p)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Bài cần chấm</h3>
              <span onClick={() => setRoute('grade')} style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.accent, cursor: 'pointer' }}>Xem tất cả →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {needGrading.length === 0 && <div style={{ fontSize: 13, color: p.faint, padding: '10px 0' }}>Tuyệt vời — không còn bài nào chờ chấm.</div>}
              {needGrading.map((a, i) => (
                <div key={a.id} onClick={() => go('grade-one', { assignment: a.id })} className="lms-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', cursor: 'pointer',
                    borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="grade" size={19} stroke={p.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: p.faint, marginTop: 2 }}>{a.class} · {a.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: p.accent, lineHeight: 1 }}>{ung(a.id)}</div>
                    <div style={{ fontSize: 10.5, color: p.faint, fontFamily: FONTS.mono, marginTop: 3 }}>chờ chấm</div>
                  </div>
                  <Icon name="chevronRight" size={18} stroke={p.faint} />
                </div>
              ))}
            </div>
          </section>

          <section style={tCard(p)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Lịch hôm nay</h3>
              <Tag p={p} color={p.sub}>3 BUỔI</Tag>
            </div>
            {DB.SCHEDULE.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                <div style={{ width: 50, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: p.ink, fontWeight: 500 }}>{s.time}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: p.faint, marginTop: 2 }}>{s.dur}</div>
                </div>
                <div style={{ width: 1, background: p.line, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 4, left: -2.5, width: 6, height: 6, borderRadius: 3, background: i === 0 ? p.accent : p.faint }} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: p.sub, marginTop: 2 }}>{s.room} · {s.cls}</div>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section style={tCard(p)}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Hoạt động</h3>
            {DB.NOTICES.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: p.sink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={n.icon} size={16} stroke={p.sub} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: p.ink, lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: p.faint, marginTop: 3, fontFamily: FONTS.mono }}>{n.time} · {n.tag}</div>
                </div>
              </div>
            ))}
          </section>

          <section style={tCard(p)}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Lối tắt</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {shortcuts.map((s) => (
                <div key={s.label} onClick={() => setRoute(s.route)} className="lms-row"
                  style={{ padding: 14, borderRadius: 12, border: `1px solid ${p.line}`, cursor: 'pointer', background: p.raise }}>
                  <Icon name={s.icon} size={19} stroke={p.accent} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, marginTop: 10 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: p.faint, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// shared bits used by class detail + assignments screen
export function AssignmentRow({ a, p, go }) {
  const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
  return (
    <div className="lms-card" onClick={() => go('grade-one', { assignment: a.id })}
      style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: hexA(tone, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="assign" size={20} stroke={tone} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{a.title}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: p.sub, flexWrap: 'wrap' }}>
          <span>{a.type}</span><span>· {a.questions} câu</span><span>· {a.points} điểm</span>
          <span style={{ fontFamily: FONTS.mono, color: tone }}>· {a.dueIn}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: p.ink }}>{a.submitted}/{a.total}</div>
        <div style={{ fontSize: 10.5, color: p.faint }}>đã nộp</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        {a.submitted > a.graded ? <Tag p={p} color={p.accent}>{a.submitted - a.graded} chờ chấm</Tag> : <Tag p={p} color={p.ok}>Đã chấm</Tag>}
      </div>
      <Icon name="chevronRight" size={18} stroke={p.faint} />
    </div>
  );
}

const DOC_ICONS = { pdf: 'docs', slide: 'image', audio: 'play', video: 'video', image: 'image', doc: 'docs' };
export function DocCardMini({ d, p }) {
  const ic = DOC_ICONS[d.type] || 'docs';
  return (
    <div className="lms-card" style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={ic} size={19} stroke={p.accent} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, lineHeight: 1.3 }}>{d.name}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 3 }}>{d.type.toUpperCase()} · {d.size}</div>
        </div>
      </div>
    </div>
  );
}
