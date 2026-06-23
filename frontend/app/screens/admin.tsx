'use client';
// screens-admin.tsx — Admin overview, classes, users, reports.
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Bars, Segmented, Stat, fmt } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { tStripe, ToggleRow, lblStyle } from '@/app/helpers/shared';

function adCard(p, pad = 22) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

export function LineChart({ data, w = 620, h = 200, stroke, fill, grid, axis, labels, sw = 2.4, pad = 14 }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const iw = w - pad * 2, ih = h - pad * 2 - 16;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * iw, pad + ih - ((v - min) / rng) * ih]);
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={pad} x2={w - pad} y1={pad + (ih / 4) * i} y2={pad + (ih / 4) * i} stroke={grid} strokeWidth="1" />)}
      <path d={`${line} L${pts[pts.length - 1][0]} ${pad + ih} L${pad} ${pad + ih} Z`} fill={fill} stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {labels && labels.map((l, i) => (
        <text key={i} x={pad + (i / (labels.length - 1)) * iw} y={h - 2} fontSize="10.5" fill={axis} textAnchor="middle" fontFamily="'DM Mono', monospace">{l}</text>
      ))}
    </svg>
  );
}

export function AOverview({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const s = DB.ADMIN_STATS;
  return (
    <div style={{ padding: '30px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, margin: '0 0 6px', color: p.ink, letterSpacing: -0.5 }}>
        Toàn cảnh <span style={{ color: p.accent }}>hệ thống</span>
      </h2>
      <p style={{ fontSize: 14, color: p.sub, margin: '0 0 26px' }}>Tài nguyên & người dùng · cập nhật theo thời gian thực.</p>

      <div className="lms-statstrip" style={{ display: 'flex', ...adCard(p, 0), padding: '22px 0', marginBottom: 24 }}>
        {[
          { l: 'Người dùng', v: fmt(s.users), d: '↑ 8,2%', up: true, sp: [8, 10, 9, 12, 11, 14, 13, 16] },
          { l: 'Học liệu', v: fmt(DB.DOCS.length), d: 'Đang chia sẻ', sp: [5, 6, 6, 7, 9, 8, 10, 11] },
          { l: 'Bài luyện tập', v: fmt(DB.STUDENT_TASKS.length), d: 'Mở cho mọi người', sp: [7, 7, 8, 8, 8, 9, 9, 9] },
          { l: 'Bài viết', v: fmt(DB.ARTICLES.length), d: '↑ mới', up: true, sp: [12, 9, 14, 11, 16, 13, 18, 19] },
        ].map((st, i) => (
          <div key={i} style={{ flex: 1, padding: '0 26px', borderLeft: i ? `1px solid ${p.line}` : 'none' }}>
            <Stat p={p} label={st.l} value={st.v} delta={st.d} up={st.up} spark={st.sp} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>
        <section style={adCard(p)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div><h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Lượt truy cập 30 ngày</h3>
              <div style={{ fontSize: 12.5, color: p.sub, marginTop: 3 }}>Số lượt xem học liệu theo ngày</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: p.ink, lineHeight: 1 }}>342</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.ok, marginTop: 4 }}>↑ 12,5%</div></div>
          </div>
          <LineChart data={s.enrollTrend} stroke={p.accent} fill={p.accentSoft} grid={p.line} axis={p.faint}
            labels={['01/06', '08/06', '15/06', '22/06', '30/06']} />
        </section>

        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Học liệu nổi bật</h3>
          {DB.DOCS.slice(0, 5).map((d, i) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="docs" size={16} stroke={p.accent} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{d.folder} · ↓ {d.downloads}</div></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function AClasses({ p, t }) {
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Field p={p} icon="search" placeholder="Tìm lớp, mã lớp, giảng viên…" style={{ width: 300 }} />
        <div style={{ flex: 1 }} />
        <Btn p={p} variant="ghost" icon="download">Xuất Excel</Btn>
        <Btn p={p} icon="plus">Tạo lớp</Btn>
      </div>
      <div className="lms-scrollx" style={adCard(p, 0)}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1fr 1.4fr 1fr', padding: '12px 22px', borderBottom: `1px solid ${p.line}`,
          fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>
          <span>LỚP HỌC</span><span>GIẢNG VIÊN</span><span>SĨ SỐ</span><span>TIẾN ĐỘ</span><span style={{ textAlign: 'right' }}>TRẠNG THÁI</span>
        </div>
        {DB.CLASSES.map((c, i) => (
          <div key={c.id} className="lms-row" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1fr 1.4fr 1fr', alignItems: 'center', padding: '14px 22px', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: hexA(tStripe(p, c.color), 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="class" size={17} stroke={tStripe(p, c.color)} /></div>
              <div><div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{c.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{c.code}</div></div>
            </div>
            <div style={{ fontSize: 13, color: p.sub }}>{c.teacher}</div>
            <div style={{ fontSize: 13, color: p.sub }}>{c.students}</div>
            <div style={{ paddingRight: 20 }}><Progress p={p} value={c.progress} height={6} color={tStripe(p, c.color)} /></div>
            <div style={{ textAlign: 'right' }}><Tag p={p} color={p.ok}>Đang học</Tag></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AUsers({ p, t }) {
  const [role, setRole] = React.useState('all');
  const list = role === 'all' ? DB.ADMIN_USERS : DB.ADMIN_USERS.filter((u) => u.role === role);
  const roleColor = (r) => ({ 'Người dùng': p.accent, 'Quản trị viên': p.warn }[r] || p.sub);
  const nUser = DB.ADMIN_USERS.filter((u) => u.role === 'Người dùng').length;
  const nAdmin = DB.ADMIN_USERS.filter((u) => u.role === 'Quản trị viên').length;
  const counts = [['Người dùng', 'users', p.accent, fmt(DB.ADMIN_STATS.users)], ['Quản trị viên', 'settings', p.warn, String(nAdmin)]];
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
        {counts.map(([r, ic, col, v]) => (
          <div key={r} style={{ ...adCard(p, 18), display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: hexA(col, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={ic} size={20} stroke={col} /></div>
            <div><div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, color: p.ink, lineHeight: 1, letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: 12.5, color: p.sub, marginTop: 4 }}>{r}</div></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Pill p={p} active={role === 'all'} onClick={() => setRole('all')}>Tất cả · {DB.ADMIN_USERS.length}</Pill>
        <Pill p={p} active={role === 'Người dùng'} onClick={() => setRole('Người dùng')}>Người dùng</Pill>
        <Pill p={p} active={role === 'Quản trị viên'} onClick={() => setRole('Quản trị viên')}>Quản trị</Pill>
        <div style={{ flex: 1 }} />
        <Btn p={p} variant="ghost" icon="download">Xuất danh sách</Btn>
        <Btn p={p} icon="plus">Thêm người dùng</Btn>
      </div>
      <div className="lms-scrollx" style={adCard(p, 0)}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.2fr 1fr', padding: '12px 22px', borderBottom: `1px solid ${p.line}`,
          fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>
          <span>NGƯỜI DÙNG</span><span>VAI TRÒ</span><span>THAM GIA</span><span style={{ textAlign: 'right' }}>TRẠNG THÁI</span>
        </div>
        {list.map((u, i) => (
          <div key={i} className="lms-row" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.2fr 1fr', alignItems: 'center', padding: '13px 22px', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} p={p} size={36} color={roleColor(u.role)} />
              <div><div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{u.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{u.email}</div></div>
            </div>
            <div><Tag p={p} color={roleColor(u.role)}>{u.role}</Tag></div>
            <div style={{ fontSize: 13, color: p.sub }}>{u.joined}</div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: u.status === 'active' ? p.ok : p.faint }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: u.status === 'active' ? p.ok : p.faint }} />
                {u.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AReports({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const bars = [
    { label: 'T2', value: 42 }, { label: 'T3', value: 55 }, { label: 'T4', value: 48 },
    { label: 'T5', value: 61 }, { label: 'T6', value: 58 }, { label: 'T7', value: 30 },
  ].map((b) => ({ ...b, color: p.accent }));
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Lượt truy cập theo ngày</h3>
          <Bars data={bars} w={520} h={160} track={p.sink} labelColor={p.faint} max={70} />
        </section>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Học liệu theo chủ đề</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            {DB.DOC_FOLDERS.filter((f) => f !== 'Tất cả').slice(0, 6).map((f, i) => {
              const n = DB.DOCS.filter((d) => d.folder === f).length;
              const pct = Math.round((n / DB.DOCS.length) * 100);
              const cols = [p.ok, p.info, p.accent, p.warn, p.danger, p.sub];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 120, fontSize: 12.5, color: p.sub }}>{f}</span>
                  <div style={{ flex: 1 }}><Progress p={p} value={pct} height={8} color={cols[i % cols.length]} /></div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: p.faint, width: 36, textAlign: 'right' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section style={{ ...adCard(p), gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: 0, color: p.ink }}>Báo cáo có sẵn</h3>
            <Btn p={p} variant="ghost" size="sm" icon="download">Xuất tất cả</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12, marginTop: 12 }}>
            {['Báo cáo người dùng', 'Lượt tải học liệu', 'Bài viết phổ biến', 'Hoạt động luyện tập'].map((r, i) => (
              <div key={i} className="lms-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: `1px solid ${p.line}`, background: p.raise, cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="report" size={18} stroke={p.accent} /></div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: p.ink }}>{r}</span>
                <Icon name="download" size={16} stroke={p.faint} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function TReports({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [cls, setCls] = React.useState('all');
  const [range, setRange] = React.useState('week');
  const dist = [['9–10 · Giỏi', 22, p.ok], ['8–9 · Khá giỏi', 31, p.info], ['6,5–8 · Khá', 30, p.accent], ['5–6,5 · TB', 13, p.warn], ['< 5 · Yếu', 4, p.danger]];
  const risk = DB.STUDENTS.filter((s) => s.status === 'risk');
  const top = DB.STUDENTS.filter((s) => s.status === 'top');
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <Select p={p} value={cls} onChange={setCls} style={{ width: 240 }}
          options={[{ value: 'all', label: 'Tất cả lớp' }, ...DB.CLASSES.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))]} />
        <Segmented p={p} value={range} onChange={setRange}
          options={[{ value: 'week', label: 'Tuần' }, { value: 'month', label: 'Tháng' }, { value: 'term', label: 'Học kỳ' }]} />
        <div style={{ flex: 1 }} />
        <Btn p={p} variant="ghost" icon="download">Xuất báo cáo</Btn>
      </div>

      <div className="lms-statstrip" style={{ display: 'flex', ...adCard(p, 0), padding: '22px 0', marginBottom: 22 }}>
        {[
          { l: 'Tỷ lệ nộp bài', v: '86', u: '%', d: '↑ 3,2%', up: true, sp: [7, 8, 8, 9, 9, 10, 11, 12] },
          { l: 'Điểm trung bình', v: '7,6', d: '↑ 0,3', up: true, sp: [6, 7, 7, 8, 7, 8, 9, 9] },
          { l: 'Bài đã chấm', v: '124', d: 'Tuần này', sp: [12, 9, 14, 11, 16, 13, 18, 19] },
          { l: 'Học viên cần hỗ trợ', v: String(risk.length), d: 'Điểm < 6,5', sp: [4, 5, 4, 6, 5, 4, 3, 2] },
        ].map((st, i) => (
          <div key={i} style={{ flex: 1, padding: '0 26px', borderLeft: i ? `1px solid ${p.lineSoft}` : 'none' }}>
            <Stat p={p} label={st.l} value={st.v} unit={st.u} delta={st.d} up={st.up} spark={st.sp} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start', marginBottom: 22 }}>
        <section style={adCard(p)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: 0, color: p.ink }}>Điểm trung bình theo tuần</h3>
              <div style={{ fontSize: 12.5, color: p.sub, marginTop: 3 }}>8 tuần gần nhất</div></div>
            <Tag p={p} color={p.ok}>↑ Cải thiện</Tag>
          </div>
          <LineChart data={[6.4, 6.8, 6.7, 7.1, 7.0, 7.3, 7.5, 7.6]} stroke={p.accent} fill={p.accentSoft} grid={p.lineSoft} axis={p.faint}
            labels={['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']} />
        </section>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: '0 0 16px', color: p.ink }}>Phân bố điểm</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dist.map(([lab, pct, col], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 104, fontSize: 12.5, color: p.sub }}>{lab}</span>
                <div style={{ flex: 1 }}><Progress p={p} value={pct} height={8} color={col} /></div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: p.faint, width: 34, textAlign: 'right' }}>{pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: '0 0 16px', color: p.ink }}>Tỷ lệ nộp bài theo lớp</h3>
          {DB.CLASSES.map((c, i) => {
            const rate = [86, 74, 91, 63][i] || 70;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: hexA(tStripe(p, c.color), 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="class" size={16} stroke={tStripe(p, c.color)} /></div>
                <div style={{ width: 150, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{c.code}</div></div>
                <div style={{ flex: 1 }}><Progress p={p} value={rate} height={7} color={tStripe(p, c.color)} /></div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12.5, color: p.sub, width: 38, textAlign: 'right' }}>{rate}%</span>
              </div>
            );
          })}
        </section>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: '0 0 14px', color: p.ink }}>Cần quan tâm</h3>
          {risk.concat(top.slice(0, 1)).map((s, i) => {
            const tone = s.status === 'risk' ? p.danger : p.ok;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
                <Avatar name={s.name} p={p} size={34} color={tone} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: p.faint }}>{s.status === 'risk' ? 'Điểm thấp, cần hỗ trợ' : 'Tiến bộ tốt'}</div></div>
                <span style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 700, color: tone }}>{s.avg.toFixed(1)}</span>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export function ASettings({ p, t, setTweak, resetTheme }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const setT = setTweak || (() => {});
  const [sec, setSec] = React.useState('appearance');
  const card = (pad) => adCard(p, pad);
  const SECTIONS = [
    { id: 'appearance', icon: 'image', label: 'Giao diện' },
    { id: 'org', icon: 'settings', label: 'Tổ chức' },
    { id: 'academic', icon: 'grade', label: 'Cấu hình đánh giá' },
    { id: 'security', icon: 'target', label: 'Bảo mật & đăng nhập' },
    { id: 'notifications', icon: 'notify', label: 'Thông báo' },
    { id: 'integration', icon: 'link', label: 'Tích hợp' },
    { id: 'data', icon: 'cloud', label: 'Dữ liệu & sao lưu' },
  ];
  const ACCENT_OPTS = [
    { k: 'grass', hex: '#3f9d5c', label: 'Xanh lá' },
    { k: 'sky', hex: '#2f7fe0', label: 'Xanh dương' },
    { k: 'coral', hex: '#ec6238', label: 'Cam' },
    { k: 'amber', hex: '#d98a12', label: 'Vàng' },
    { k: 'grape', hex: '#8a52d6', label: 'Tím' },
  ];
  const AR = ({ label, desc, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderTop: `1px solid ${p.lineSoft}` }}>
      <div><div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: p.faint, marginTop: 2 }}>{desc}</div>}</div>
      {children}
    </div>
  );
  const H = ({ children, desc }) => (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: 0, color: p.ink }}>{children}</h3>
      {desc && <div style={{ fontSize: 12.5, color: p.faint, marginTop: 3 }}>{desc}</div>}
    </div>
  );
  // (mục phân quyền vai trò đã được gỡ bỏ theo yêu cầu)
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto', display: 'grid', gridTemplateColumns: '230px 1fr', gap: 24, alignItems: 'start' }}>
      <aside style={{ ...card(8), padding: 8, position: 'sticky', top: 0 }}>
        {SECTIONS.map((s) => {
          const on = sec === s.id;
          return (
            <div key={s.id} onClick={() => setSec(s.id)} className="lms-nav-item"
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                backgroundColor: on ? p.activeBg : 'transparent', color: on ? p.accent : p.sub, fontWeight: on ? 600 : 500, fontSize: 13.5 }}>
              <Icon name={s.icon} size={17} stroke={on ? p.accent : p.faint} /> <span>{s.label}</span>
            </div>
          );
        })}
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sec === 'appearance' && (
          <section style={card(24)}>
            <H desc="Tuỳ chỉnh màu thương hiệu, phông chữ và bố cục — áp dụng tức thì cho toàn hệ thống và được lưu lại.">Giao diện & thương hiệu</H>

            {/* Live preview — phản ánh ngay lựa chọn bên dưới */}
            <div style={{ borderRadius: 12, border: `1px solid ${p.line}`, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: p.railBg, borderBottom: `1px solid ${p.lineSoft}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontWeight: 700, fontSize: 16 }}>V</div>
                <div style={{ fontFamily: serif, fontSize: 15.5, fontWeight: 700, color: p.ink }}>Vườn Văn</div>
                <div style={{ marginLeft: 'auto' }}><Tag p={p} color={p.accent}>Bản xem trước</Tag></div>
              </div>
              <div style={{ background: p.bg, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Btn p={p}>Nút chính</Btn>
                <Btn p={p} variant="soft" icon="plus">Tạo mới</Btn>
                <Btn p={p} variant="ghost">Phụ</Btn>
                <div style={{ flex: 1, minWidth: 150 }}><Progress p={p} value={68} /></div>
              </div>
            </div>

            {/* Màu chủ đạo */}
            <div style={{ marginBottom: 24 }}>
              <label style={lblStyle(p)}>MÀU CHỦ ĐẠO</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {ACCENT_OPTS.map((o) => {
                  const on = t.accent === o.k;
                  return (
                    <button key={o.k} onClick={() => setT({ accent: o.k })} title={o.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 14px 0 10px', borderRadius: 11, cursor: 'pointer',
                        border: `1.5px solid ${on ? o.hex : p.line}`, background: on ? hexA(o.hex, 0.1) : p.surface, color: on ? o.hex : p.sub, fontWeight: 600, fontSize: 13 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 6, background: o.hex }} /> {o.label}
                    </button>
                  );
                })}
                <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 14px 0 10px', borderRadius: 11, cursor: 'pointer',
                  border: `1.5px solid ${t.accent === 'custom' ? (t.accentHex || p.accent) : p.line}`, background: t.accent === 'custom' ? hexA(t.accentHex || p.accent, 0.1) : p.surface,
                  color: t.accent === 'custom' ? (t.accentHex || p.accent) : p.sub, fontWeight: 600, fontSize: 13 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 6, background: t.accentHex || p.accent, boxShadow: `inset 0 0 0 1px ${hexA('#000', 0.12)}` }} />
                  Tuỳ chỉnh
                  <input type="color" value={t.accentHex || p.accent} onChange={(e) => setT({ accent: 'custom', accentHex: e.target.value })}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                </label>
              </div>
            </div>

            {/* Phông chữ + chế độ hiển thị */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div>
                <label style={lblStyle(p)}>PHÔNG TIÊU ĐỀ</label>
                <Select p={p} value={t.headingFont} style={{ marginTop: 8 }} onChange={(v) => setT({ headingFont: v })}
                  options={[{ value: 'baloo', label: 'Baloo 2 — bo tròn, thân thiện' }, { value: 'jakarta', label: 'Plus Jakarta Sans' }, { value: 'sora', label: 'Sora' }, { value: 'system', label: 'Hệ thống' }]} />
                <div style={{ fontFamily: serif, fontSize: 21, fontWeight: 700, color: p.ink, marginTop: 12, letterSpacing: -0.4 }}>Học hay mỗi ngày</div>
              </div>
              <div>
                <label style={lblStyle(p)}>CHẾ ĐỘ HIỂN THỊ</label>
                <div style={{ marginTop: 8 }}>
                  <Segmented p={p} value={!!t.dark} onChange={(v) => setT({ dark: v })}
                    options={[{ value: false, label: 'Sáng', icon: 'sun' }, { value: true, label: 'Tối', icon: 'moon' }]} />
                </div>
              </div>
            </div>

            {/* Bố cục */}
            <label style={lblStyle(p)}>BỐ CỤC</label>
            <div style={{ marginTop: 4 }}>
              <AR label="Mật độ hiển thị" desc="Khoảng cách & độ nén của giao diện">
                <Segmented p={p} value={t.density} onChange={(v) => setT({ density: v })} options={[{ value: 'compact', label: 'Gọn' }, { value: 'regular', label: 'Tiêu chuẩn' }]} />
              </AR>
              <AR label="Thanh điều hướng" desc="Độ rộng thanh bên khu quản trị">
                <Segmented p={p} value={!!t.railWide} onChange={(v) => setT({ railWide: v })} options={[{ value: false, label: 'Tiêu chuẩn' }, { value: true, label: 'Rộng' }]} />
              </AR>
              <AR label="Luồng giao bài" desc="Trình tự khi giáo viên tạo bài tập">
                <Segmented p={p} value={t.assignFlow} onChange={(v) => setT({ assignFlow: v })} options={[{ value: 'wizard', label: 'Theo bước' }, { value: 'single', label: 'Một trang' }]} />
              </AR>
              <AR label="Hiển thị rubric" desc="Cách trình bày tiêu chí chấm điểm">
                <Segmented p={p} value={t.rubricStyle} onChange={(v) => setT({ rubricStyle: v })} options={[{ value: 'matrix', label: 'Ma trận' }, { value: 'cards', label: 'Thẻ' }]} />
              </AR>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 18, borderTop: `1px solid ${p.lineSoft}` }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.faint, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="checkCircle" size={15} stroke={p.ok} /> Thay đổi được lưu tự động
              </div>
              <Btn p={p} variant="ghost" onClick={() => resetTheme && resetTheme()}>Khôi phục mặc định</Btn>
            </div>
          </section>
        )}

        {sec === 'org' && (
          <section style={card(24)}>
            <H desc="Thông tin chung của trung tâm hiển thị trên toàn hệ thống.">Tổ chức</H>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 28, fontWeight: 700 }}>V</div>
              <Btn p={p} variant="ghost" icon="upload">Đổi logo</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={lblStyle(p)}>TÊN TRUNG TÂM</label><Field p={p} value="Vườn Văn" onChange={() => {}} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>TÊN MIỀN</label><Field p={p} value="vuonvan.edu.vn" onChange={() => {}} mono style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>MÚI GIỜ</label><Select p={p} value="hcm" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: 'hcm', label: '(GMT+7) Hồ Chí Minh' }]} /></div>
            </div>
          </section>
        )}

        {sec === 'security' && (
          <section style={card(24)}>
            <H desc="Chính sách đăng nhập và bảo vệ tài khoản toàn hệ thống.">Bảo mật & đăng nhập</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <ToggleRow p={p} label="Xác thực hai lớp (2FA) bắt buộc cho quản trị" def={true} />
              <ToggleRow p={p} label="Cho phép đăng nhập bằng Google (SSO)" def={true} />
              <ToggleRow p={p} label="Bắt buộc đổi mật khẩu định kỳ 90 ngày" def={false} />
              <ToggleRow p={p} label="Khoá tài khoản sau 5 lần đăng nhập sai" def={true} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={lblStyle(p)}>ĐỘ DÀI MẬT KHẨU TỐI THIỂU</label><Field p={p} value="8" onChange={() => {}} mono style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>HẾT PHIÊN SAU</label><Select p={p} value="8h" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: '1h', label: '1 giờ' }, { value: '8h', label: '8 giờ' }, { value: '24h', label: '24 giờ' }]} /></div>
            </div>
          </section>
        )}

        {sec === 'academic' && (
          <section style={card(24)}>
            <H desc="Quy định chấm điểm & đánh giá áp dụng toàn hệ thống.">Cấu hình đánh giá</H>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div><label style={lblStyle(p)}>THANG ĐIỂM</label><Select p={p} value="10" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: '10', label: 'Hệ 10' }, { value: '100', label: 'Hệ 100' }, { value: 'letter', label: 'Điểm chữ A–F' }]} /></div>
              <div><label style={lblStyle(p)}>ĐIỂM ĐẠT TỐI THIỂU</label><Field p={p} value="5,0" onChange={() => {}} mono style={{ marginTop: 8 }} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ToggleRow p={p} label="Làm tròn điểm đến 0,5" def={true} />
              <ToggleRow p={p} label="Cho phép người dùng phúc khảo" def={true} />
              <ToggleRow p={p} label="Hiển thị điểm ngay sau khi nộp" def={true} />
            </div>
          </section>
        )}

        {sec === 'notifications' && (
          <section style={card(24)}>
            <H desc="Kênh và quy tắc gửi thông báo cho người dùng.">Thông báo</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <ToggleRow p={p} label="Gửi email khi có bài tập mới" def={true} />
              <ToggleRow p={p} label="Nhắc hạn nộp bài trước 24 giờ" def={true} />
              <ToggleRow p={p} label="Thông báo khi điểm được công bố" def={true} />
              <ToggleRow p={p} label="Gửi báo cáo tổng hợp định kỳ cho quản trị" def={false} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={lblStyle(p)}>KÊNH GỬI</label><Select p={p} value="both" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: 'email', label: 'Email' }, { value: 'app', label: 'Trong ứng dụng' }, { value: 'both', label: 'Email + ứng dụng' }]} /></div>
              <div><label style={lblStyle(p)}>TẦN SUẤT TÓM TẮT</label><Select p={p} value="week" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: 'day', label: 'Hằng ngày' }, { value: 'week', label: 'Hằng tuần' }]} /></div>
            </div>
          </section>
        )}

        {sec === 'integration' && (
          <section style={card(24)}>
            <H desc="Kết nối email, lưu trữ và API bên ngoài.">Tích hợp</H>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div><label style={lblStyle(p)}>MÁY CHỦ EMAIL (SMTP)</label><Field p={p} value="smtp.vuonvan.edu.vn" onChange={() => {}} mono style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>DỊCH VỤ LƯU TRỮ</label><Select p={p} value="s3" onChange={() => {}} style={{ marginTop: 8 }} options={[{ value: 's3', label: 'Amazon S3' }, { value: 'local', label: 'Máy chủ nội bộ' }]} /></div>
            </div>
            <label style={lblStyle(p)}>API KEY</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Field p={p} value="sk_live_••••••••••••3f9a" onChange={() => {}} mono style={{ flex: 1 }} />
              <Btn p={p} variant="ghost" icon="copy">Tạo lại</Btn>
            </div>
          </section>
        )}

        {sec === 'data' && (
          <section style={card(24)}>
            <H desc="Sao lưu tự động và quản lý dung lượng toàn hệ thống.">Dữ liệu & sao lưu</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <ToggleRow p={p} label="Tự động sao lưu hằng ngày" def={true} />
              <ToggleRow p={p} label="Mã hoá dữ liệu sao lưu" def={true} />
            </div>
            <div style={{ ...card(16), background: p.raise, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>Dung lượng hệ thống</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: p.sub }}>64,2 / 200 GB</span>
              </div>
              <Progress p={p} value={32} height={8} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn p={p} icon="download">Sao lưu ngay</Btn>
              <Btn p={p} variant="ghost" icon="upload">Khôi phục</Btn>
            </div>
          </section>
        )}

        {sec !== 'appearance' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn p={p} variant="ghost">Khôi phục mặc định</Btn>
            <Btn p={p} icon="check">Lưu thay đổi</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
