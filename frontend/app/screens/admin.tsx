'use client';
// screens-admin.tsx — Admin overview, classes, users, reports.
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Bars, Segmented, Stat, fmt } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { tStripe, ToggleRow, lblStyle } from '@/app/helpers/shared';
import { usersApi, settingsApi, filesApi, exercisesApi, articlesApi, rubricsApi, questionsApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { downloadCsv, downloadJson } from '@/app/helpers/export';

// Lightweight inline modal (design's inline-style system; no antd).
function AdminModal({ p, title, onClose, children }) {
  const serif = FONTS.display;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: hexA('#0f1726', 0.5),
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: p.surface,
        border: `1px solid ${p.line}`, borderRadius: 14, boxShadow: `0 24px 60px ${hexA('#0f1726', 0.28)}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${p.lineSoft}` }}>
          <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: p.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
            <Icon name="x" size={18} stroke={p.faint} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

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
  // Số liệu thật từ /stats/overview (load-stats). Delta theo % xu hướng thật.
  const dlt = (pct) => (pct == null ? '—' : (pct >= 0 ? '↑ ' : '↓ ') + Math.abs(pct).toLocaleString('vi-VN') + '%');
  const spark = (s.enrollTrend || []).slice(-8);
  const fmtMd = (iso) => { const a = String(iso || '').split('-'); return a[2] && a[1] ? `${a[2]}/${a[1]}` : ''; };
  const dates = s.enrollDates || [];
  const chartLabels = dates.length
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => fmtMd(dates[Math.round(f * (dates.length - 1))]))
    : ['01/06', '08/06', '15/06', '22/06', '30/06'];
  return (
    <div style={{ padding: '30px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, margin: '0 0 6px', color: p.ink, letterSpacing: -0.5 }}>
        Toàn cảnh <span style={{ color: p.accent }}>hệ thống</span>
      </h2>
      <p style={{ fontSize: 14, color: p.sub, margin: '0 0 26px' }}>Tài nguyên & người dùng · cập nhật theo thời gian thực.</p>

      <div className="lms-statstrip" style={{ display: 'flex', ...adCard(p, 0), padding: '22px 0', marginBottom: 24 }}>
        {[
          { l: 'Người dùng', v: fmt(s.users), d: dlt(s.trends?.users), up: (s.trends?.users ?? 0) >= 0, sp: spark },
          { l: 'Học liệu', v: fmt(s.docs ?? DB.DOCS.length), d: dlt(s.trends?.files), up: (s.trends?.files ?? 0) >= 0, sp: spark },
          { l: 'Bài luyện tập', v: fmt(s.exercises ?? DB.STUDENT_TASKS.length), d: dlt(s.trends?.exercises), up: (s.trends?.exercises ?? 0) >= 0, sp: spark },
          { l: 'Bài viết', v: fmt(s.articles ?? DB.ARTICLES.length), d: dlt(s.trends?.articles), up: (s.trends?.articles ?? 0) >= 0, sp: spark },
        ].map((st, i) => (
          <div key={i} style={{ flex: 1, padding: '0 26px', borderLeft: i ? `1px solid ${p.line}` : 'none' }}>
            <Stat p={p} label={st.l} value={st.v} delta={st.d} up={st.up} spark={st.sp} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>
        <section style={adCard(p)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div><h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Lượt làm bài 30 ngày</h3>
              <div style={{ fontSize: 12.5, color: p.sub, marginTop: 3 }}>Số lượt làm bài tập theo ngày</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: p.ink, lineHeight: 1 }}>{fmt(s.activityTotal ?? 0)}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: (s.activityTrend ?? 0) >= 0 ? p.ok : p.danger, marginTop: 4 }}>{dlt(s.activityTrend)}</div></div>
          </div>
          <LineChart data={s.enrollTrend} stroke={p.accent} fill={p.accentSoft} grid={p.line} axis={p.faint}
            labels={chartLabels} />
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


// Backend role enum ↔ Vietnamese label used by the admin two-bucket model.
const ROLE_LABEL = { admin: 'Quản trị viên', teacher: 'Người dùng', student: 'Người dùng' };
const fmtJoined = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return '—'; }
};

export function AUsers({ p, t }) {
  const [role, setRole] = React.useState('all');
  // Live users from the API (keeps _id + raw role/status for edit/delete).
  // Falls back to DB.ADMIN_USERS mock when the API is down / not admin.
  const [users, setUsers] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  // modal: null | { mode:'create'|'edit', user? }
  const [modal, setModal] = React.useState(null);

  const refetch = React.useCallback(async () => {
    try {
      const res = await usersApi.list({ pageSize: 200 });
      const records = res?.records ?? [];
      setUsers(records.map((u) => ({
        id: u._id || u.id,
        name: u.name,
        email: u.email,
        rawRole: u.role || 'student',
        role: ROLE_LABEL[u.role] || 'Người dùng',
        joined: fmtJoined(u.createdAt),
        status: u.status || 'active',
      })));
    } catch {
      setUsers(null); // keep mock fallback
    }
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  // Live list if loaded, otherwise the mock DB shape (which lacks ids).
  const all = users ?? DB.ADMIN_USERS.map((u) => ({ ...u, id: undefined, rawRole: u.role === 'Quản trị viên' ? 'admin' : 'student' }));
  const list = role === 'all' ? all : all.filter((u) => u.role === role);
  const roleColor = (r) => ({ 'Người dùng': p.accent, 'Quản trị viên': p.warn }[r] || p.sub);
  const nAdmin = all.filter((u) => u.role === 'Quản trị viên').length;
  const total = users ? all.length : DB.ADMIN_STATS.users;
  const counts = [['Người dùng', 'users', p.accent, fmt(total)], ['Quản trị viên', 'settings', p.warn, String(nAdmin)]];

  const handleDelete = async (u) => {
    if (!u?.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Xoá người dùng "${u.name}"?`)) return;
    setBusy(true);
    try { await usersApi.remove(u.id); } catch {}
    setBusy(false);
    await refetch();
    try { await hydrateFor('a-users'); } catch {}
  };

  const handleSave = async (form, mode, editId) => {
    setBusy(true);
    try {
      if (mode === 'edit' && editId) {
        const body: any = { name: form.name, email: form.email, role: form.role, status: form.status };
        if (form.password) body.password = form.password;
        await usersApi.update(editId, body);
      } else {
        await usersApi.create({ name: form.name, email: form.email, password: form.password, role: form.role, status: form.status });
      }
      setModal(null);
      await refetch();
      try { await hydrateFor('a-users'); } catch {}
    } catch (e) {
      if (typeof window !== 'undefined') window.alert('Không thể lưu người dùng. Vui lòng kiểm tra dữ liệu hoặc quyền truy cập.');
    }
    setBusy(false);
  };

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
        <Pill p={p} active={role === 'all'} onClick={() => setRole('all')}>Tất cả · {all.length}</Pill>
        <Pill p={p} active={role === 'Người dùng'} onClick={() => setRole('Người dùng')}>Người dùng</Pill>
        <Pill p={p} active={role === 'Quản trị viên'} onClick={() => setRole('Quản trị viên')}>Quản trị</Pill>
        <div style={{ flex: 1 }} />
        <Btn p={p} variant="ghost" icon="download" onClick={() => downloadCsv('nguoi-dung.csv', [{ key: 'name', label: 'Họ tên' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Vai trò' }, { key: 'status', label: 'Trạng thái' }, { key: 'joined', label: 'Tham gia' }], all)}>Xuất danh sách</Btn>
        <Btn p={p} icon="plus" onClick={() => setModal({ mode: 'create' })}>Thêm người dùng</Btn>
      </div>
      <div className="lms-scrollx" style={adCard(p, 0)}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.2fr 1fr 86px', padding: '12px 22px', borderBottom: `1px solid ${p.line}`,
          fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>
          <span>NGƯỜI DÙNG</span><span>VAI TRÒ</span><span>THAM GIA</span><span>TRẠNG THÁI</span><span style={{ textAlign: 'right' }}>THAO TÁC</span>
        </div>
        {list.map((u, i) => (
          <div key={u.id || i} className="lms-row" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.2fr 1fr 86px', alignItems: 'center', padding: '13px 22px', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} p={p} size={36} color={roleColor(u.role)} />
              <div><div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{u.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{u.email}</div></div>
            </div>
            <div><Tag p={p} color={roleColor(u.role)}>{u.role}</Tag></div>
            <div style={{ fontSize: 13, color: p.sub }}>{u.joined}</div>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: u.status === 'active' ? p.ok : p.faint }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: u.status === 'active' ? p.ok : p.faint }} />
                {u.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button title="Sửa" disabled={!u.id} onClick={() => u.id && setModal({ mode: 'edit', user: u })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, cursor: u.id ? 'pointer' : 'not-allowed',
                  border: `1px solid ${p.line}`, background: p.surface, opacity: u.id ? 1 : 0.4 }}>
                <Icon name="pen" size={15} stroke={p.sub} />
              </button>
              <button title="Xoá" disabled={!u.id || busy} onClick={() => handleDelete(u)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, cursor: u.id ? 'pointer' : 'not-allowed',
                  border: `1px solid ${hexA(p.danger, 0.35)}`, background: p.surface, opacity: u.id ? 1 : 0.4 }}>
                <Icon name="trash" size={15} stroke={p.danger} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <UserFormModal p={p} mode={modal.mode} user={modal.user} busy={busy}
          onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}

// Create / edit user form rendered inside AdminModal.
function UserFormModal({ p, mode, user, busy, onClose, onSave }) {
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [password, setPassword] = React.useState('');
  const [roleVal, setRoleVal] = React.useState(user?.rawRole || 'student');
  const [statusVal, setStatusVal] = React.useState(user?.status || 'active');
  const isEdit = mode === 'edit';
  const canSave = name.trim().length >= 2 && /.+@.+\..+/.test(email) && (isEdit || password.length >= 6);
  return (
    <AdminModal p={p} title={isEdit ? 'Sửa người dùng' : 'Thêm người dùng'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lblStyle(p)}>HỌ TÊN</label><Field p={p} value={name} onChange={setName} placeholder="Nguyễn Văn A" style={{ marginTop: 8 }} /></div>
        <div><label style={lblStyle(p)}>EMAIL</label><Field p={p} value={email} onChange={setEmail} placeholder="a@email.com" mono style={{ marginTop: 8 }} /></div>
        <div><label style={lblStyle(p)}>MẬT KHẨU{isEdit ? ' (để trống nếu giữ nguyên)' : ''}</label>
          <Field p={p} value={password} onChange={setPassword} type="password" placeholder={isEdit ? '••••••' : 'Tối thiểu 6 ký tự'} style={{ marginTop: 8 }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lblStyle(p)}>VAI TRÒ</label>
            <Select p={p} value={roleVal} onChange={setRoleVal} style={{ marginTop: 8 }}
              options={[{ value: 'student', label: 'Học viên' }, { value: 'teacher', label: 'Giáo viên' }, { value: 'admin', label: 'Quản trị viên' }]} /></div>
          <div><label style={lblStyle(p)}>TRẠNG THÁI</label>
            <Select p={p} value={statusVal} onChange={setStatusVal} style={{ marginTop: 8 }}
              options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Tạm ngưng' }]} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <Btn p={p} variant="ghost" onClick={onClose}>Huỷ</Btn>
          <Btn p={p} icon="check"
            onClick={() => { if (canSave && !busy) onSave({ name: name.trim(), email: email.trim(), password, role: roleVal, status: statusVal }, mode, user?.id); }}>
            {isEdit ? 'Lưu' : 'Tạo người dùng'}
          </Btn>
        </div>
      </div>
    </AdminModal>
  );
}

export function AReports({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  // Lượt làm bài 7 ngày gần nhất từ /stats/reports (load-reports).
  const r = DB.ADMIN_REPORTS || {};
  const weekdayVi = (iso) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(iso).getDay()];
  const bars = (Array.isArray(r.weeklySeries) && r.weeklySeries.length
    ? r.weeklySeries.map((x) => ({ label: weekdayVi(x.date), value: x.count }))
    : [{ label: 'T2', value: 0 }, { label: 'T3', value: 0 }, { label: 'T4', value: 0 }, { label: 'T5', value: 0 }, { label: 'T6', value: 0 }, { label: 'T7', value: 0 }]
  ).map((b) => ({ ...b, color: p.accent }));
  const maxBar = Math.max(10, ...bars.map((b) => b.value));
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <section style={adCard(p)}>
          <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Lượt làm bài theo ngày</h3>
          <Bars data={bars} w={520} h={160} track={p.sink} labelColor={p.faint} max={maxBar} />
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

export function ASettings({ p, t, setTweak, resetTheme }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const setT = setTweak || (() => {});
  const [sec, setSec] = React.useState('appearance');
  const card = (pad) => adCard(p, pad);

  // Live system settings (org + misc) loaded from settingsApi.get; appearance
  // stays driven by the theme tweaks (setTweak) for the instant live preview.
  const ORG_DEFAULTS = { name: 'Vườn Văn', domain: 'vuonvan.edu.vn', timezone: 'hcm' };
  // backend stores IANA tz; map to/from the design's single 'hcm' option.
  const tzToOpt = (tz) => (tz === 'Asia/Ho_Chi_Minh' || !tz ? 'hcm' : tz);
  const optToTz = (o) => (o === 'hcm' ? 'Asia/Ho_Chi_Minh' : o);
  const [org, setOrg] = React.useState(ORG_DEFAULTS);
  const [misc, setMisc] = React.useState({ allowGoogleLogin: true });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [homepage, setHomepage] = React.useState({ badge: '', heroTitle: '', heroSubtitle: '', ctaLabel: '' });
  const [seo, setSeo] = React.useState({ title: '', description: '', keywords: '', ogImage: '' });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await settingsApi.get();
        if (!alive || !s) return;
        if (s.org) setOrg({
          name: s.org.name ?? ORG_DEFAULTS.name,
          domain: s.org.domain ?? '',
          timezone: tzToOpt(s.org.timezone),
        });
        if (s.misc) setMisc({ allowGoogleLogin: s.misc.allowGoogleLogin !== false });
        if (s.homepage) setHomepage({ badge: s.homepage.badge ?? '', heroTitle: s.homepage.heroTitle ?? '', heroSubtitle: s.homepage.heroSubtitle ?? '', ctaLabel: s.homepage.ctaLabel ?? '' });
        if (s.seo) setSeo({ title: s.seo.title ?? '', description: s.seo.description ?? '', keywords: (s.seo.keywords ?? []).join(', '), ogImage: s.seo.ogImage ?? '' });
      } catch { /* API down / not authed → keep defaults */ }
    })();
    return () => { alive = false; };
  }, []);

  const saveSettings = React.useCallback(async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        org: { name: org.name, domain: org.domain, timezone: optToTz(org.timezone) },
        misc: { allowGoogleLogin: misc.allowGoogleLogin },
        homepage: { badge: homepage.badge, heroTitle: homepage.heroTitle, heroSubtitle: homepage.heroSubtitle, ctaLabel: homepage.ctaLabel },
        seo: { title: seo.title, description: seo.description, keywords: seo.keywords.split(',').map((x) => x.trim()).filter(Boolean), ogImage: seo.ogImage || undefined },
      });
      setSaved(true);
      if (typeof window !== 'undefined') window.setTimeout(() => setSaved(false), 2500);
    } catch {
      if (typeof window !== 'undefined') window.alert('Không thể lưu cấu hình. Vui lòng kiểm tra quyền truy cập.');
    }
    setSaving(false);
  }, [org, misc, homepage, seo]);
  const SECTIONS = [
    { id: 'appearance', icon: 'image', label: 'Giao diện' },
    { id: 'org', icon: 'settings', label: 'Tổ chức' },
    { id: 'homepage', icon: 'home', label: 'Trang chủ' },
    { id: 'seo', icon: 'search', label: 'SEO' },
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
              <div><label style={lblStyle(p)}>TÊN TRUNG TÂM</label><Field p={p} value={org.name} onChange={(v) => setOrg((o) => ({ ...o, name: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>TÊN MIỀN</label><Field p={p} value={org.domain} onChange={(v) => setOrg((o) => ({ ...o, domain: v }))} mono style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>MÚI GIỜ</label><Select p={p} value={org.timezone} onChange={(v) => setOrg((o) => ({ ...o, timezone: v }))} style={{ marginTop: 8 }} options={[{ value: 'hcm', label: '(GMT+7) Hồ Chí Minh' }]} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16, padding: '12px 14px', borderRadius: 12, border: `1px solid ${p.line}`, background: p.raise }}>
              <span style={{ fontSize: 13.5, color: p.ink }}>Cho phép đăng nhập bằng Google (SSO)</span>
              <Segmented p={p} value={!!misc.allowGoogleLogin} onChange={(v) => setMisc((m) => ({ ...m, allowGoogleLogin: v }))}
                options={[{ value: true, label: 'Bật' }, { value: false, label: 'Tắt' }]} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${p.lineSoft}` }}>
              {saved && (
                <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.ok, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="checkCircle" size={15} stroke={p.ok} /> Đã lưu
                </span>
              )}
              <Btn p={p} icon="check" onClick={() => { if (!saving) saveSettings(); }}>Lưu thay đổi</Btn>
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

        {sec === 'homepage' && (
          <section style={card(24)}>
            <H desc="Nội dung hiển thị ngoài trang chủ công khai (admin tự chỉnh).">Trang chủ</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={lblStyle(p)}>NHÃN (BADGE)</label><Field p={p} value={homepage.badge} onChange={(v) => setHomepage((o) => ({ ...o, badge: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>TIÊU ĐỀ HERO</label><Field p={p} value={homepage.heroTitle} onChange={(v) => setHomepage((o) => ({ ...o, heroTitle: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>MÔ TẢ HERO</label><textarea value={homepage.heroSubtitle} onChange={(e) => setHomepage((o) => ({ ...o, heroSubtitle: e.target.value }))} style={{ width: '100%', minHeight: 70, marginTop: 8, padding: 12, borderRadius: 12, border: `1px solid ${p.line}`, background: p.surface, color: p.ink, fontFamily: FONTS.sans, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ maxWidth: 280 }}><label style={lblStyle(p)}>NHÃN NÚT (CTA)</label><Field p={p} value={homepage.ctaLabel} onChange={(v) => setHomepage((o) => ({ ...o, ctaLabel: v }))} style={{ marginTop: 8 }} /></div>
            </div>
          </section>
        )}

        {sec === 'seo' && (
          <section style={card(24)}>
            <H desc="Thẻ tiêu đề, mô tả và từ khóa cho trang công khai.">SEO</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={lblStyle(p)}>TIÊU ĐỀ TRANG (TITLE)</label><Field p={p} value={seo.title} onChange={(v) => setSeo((o) => ({ ...o, title: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>MÔ TẢ (DESCRIPTION)</label><textarea value={seo.description} onChange={(e) => setSeo((o) => ({ ...o, description: e.target.value }))} style={{ width: '100%', minHeight: 64, marginTop: 8, padding: 12, borderRadius: 12, border: `1px solid ${p.line}`, background: p.surface, color: p.ink, fontFamily: FONTS.sans, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div><label style={lblStyle(p)}>TỪ KHÓA (cách nhau bằng dấu phẩy)</label><Field p={p} value={seo.keywords} onChange={(v) => setSeo((o) => ({ ...o, keywords: v }))} style={{ marginTop: 8 }} /></div>
              <div><label style={lblStyle(p)}>ẢNH OG (URL)</label><Field p={p} value={seo.ogImage} onChange={(v) => setSeo((o) => ({ ...o, ogImage: v }))} mono style={{ marginTop: 8 }} /></div>
            </div>
          </section>
        )}

        {sec === 'data' && (
          <section style={card(24)}>
            <H desc="Sao lưu tự động toàn hệ thống.">Dữ liệu & sao lưu</H>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <ToggleRow p={p} label="Tự động sao lưu hằng ngày" def={true} />
              <ToggleRow p={p} label="Mã hoá dữ liệu sao lưu" def={true} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn p={p} icon="download">Sao lưu ngay</Btn>
              <Btn p={p} variant="ghost" icon="upload">Khôi phục</Btn>
            </div>
          </section>
        )}

        {sec !== 'appearance' && sec !== 'org' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            {saved && (
              <span style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.ok, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="checkCircle" size={15} stroke={p.ok} /> Đã lưu
              </span>
            )}
            <Btn p={p} variant="ghost">Khôi phục mặc định</Btn>
            <Btn p={p} icon="check" onClick={() => { if (!saving) saveSettings(); }}>Lưu thay đổi</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
