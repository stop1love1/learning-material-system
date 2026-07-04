'use client';
import React from 'react';
import { Table } from 'antd';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Bars, Segmented, Stat, fmt } from '@/app/components/ui';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/store/store';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { usersApi, settingsApi, statsApi } from '@/app/lib/api';
import { refreshOrgBrand } from '@/app/components/Brand';
import { refreshGoogleConfig } from '@/app/lib/google-config';
import { refreshAiGemUrl } from '@/app/lib/ai-gem';
import { promptDialog, confirmDialog, toastSuccess, toastError, notifySuccess } from '@/app/lib/ui/dialogs';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { downloadCsv, downloadJson } from '@/app/helpers/export';
import { FilterSelect } from '@/app/components/FilterSelect';
import RichEditor from '@/app/components/RichEditor';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapUser } from '@/app/lib/sync/load-users';

function AdminModal({ p, title, onClose, children }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(15,23,38,0.5)] p-5">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] overflow-hidden rounded-[14px] border border-lms-line bg-lms-surface shadow-[0_24px_60px_rgba(15,23,38,0.28)]">
        <div className="flex items-center justify-between border-b border-lms-line-soft px-5 py-4">
          <div className="font-lms-heading text-[17px] font-semibold text-lms-ink">{title}</div>
          <button onClick={onClose} className="cursor-pointer border-0 bg-transparent p-1 leading-none">
            <Icon name="x" size={18} stroke={p.faint} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function LineChart({ data, w = 620, h = 200, stroke, fill, grid, axis, labels, sw = 2.4, pad = 14 }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: h }} className="flex items-center justify-center text-[12.5px] text-lms-faint">
        Chưa có dữ liệu để hiển thị biểu đồ.
      </div>
    );
  }
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const iw = w - pad * 2, ih = h - pad * 2 - 16;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * iw, pad + ih - ((v - min) / rng) * ih]);
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
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
  const s = DB.ADMIN_STATS;
  const dlt = (pct) => (pct == null ? '—' : (pct >= 0 ? '↑ ' : '↓ ') + Math.abs(pct).toLocaleString('vi-VN') + '%');
  const spark = (s.enrollTrend || []).slice(-8);
  const fmtMd = (iso) => { const a = String(iso || '').split('-'); return a[2] && a[1] ? `${a[2]}/${a[1]}` : ''; };
  const dates = s.enrollDates || [];
  const chartLabels = dates.length
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => fmtMd(dates[Math.round(f * (dates.length - 1))]))
    : ['01/06', '08/06', '15/06', '22/06', '30/06'];
  return (
    <div className="mx-auto max-w-none px-[30px] lms-content-pad pb-10 pt-[30px]">
      <h2 className="mb-1.5 mt-0 font-lms-heading text-[30px] font-medium tracking-tight text-lms-ink">
        Toàn cảnh <span className="text-lms-accent">hệ thống</span>
      </h2>
      <p className="mb-[26px] mt-0 text-sm text-lms-sub">Tài nguyên & người dùng · cập nhật theo thời gian thực.</p>

      <div className={`lms-statstrip flex ${cardClass(20)} p-0! py-[22px]! mb-6`}>
        {[
          { l: 'Người dùng', v: fmt(s.users), d: dlt(s.trends?.users), up: (s.trends?.users ?? 0) >= 0, sp: spark },
          { l: 'Học liệu', v: fmt(s.docs ?? DB.DOCS.length), d: dlt(s.trends?.files), up: (s.trends?.files ?? 0) >= 0, sp: spark },
          { l: 'Bài luyện tập', v: fmt(s.exercises ?? DB.STUDENT_TASKS.length), d: dlt(s.trends?.exercises), up: (s.trends?.exercises ?? 0) >= 0, sp: spark },
          { l: 'Bài viết', v: fmt(s.articles ?? DB.ARTICLES.length), d: dlt(s.trends?.articles), up: (s.trends?.articles ?? 0) >= 0, sp: spark },
        ].map((st, i) => (
          <div key={i} className={`flex-1 px-[26px] ${i ? 'border-l border-lms-line' : ''}`}>
            <Stat p={p} label={st.l} value={st.v} delta={st.d} up={st.up} spark={st.sp} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] min-[961px]:grid-cols-[1.6fr_1fr]">
        <section className={`${cardClass(20)} p-[22px]!`}>
          <div className="mb-[18px] flex items-start justify-between">
            <div>
              <h3 className="m-0 font-lms-heading text-xl font-medium text-lms-ink">Lượt làm bài 30 ngày</h3>
              <div className="mt-[3px] text-[12.5px] text-lms-sub">Số lượt làm bài tập theo ngày</div>
            </div>
            <div className="text-right">
              <div className="font-lms-heading text-[28px] font-semibold leading-none text-lms-ink">{fmt(s.activityTotal ?? 0)}</div>
              <div className={`mt-1 font-mono text-[11.5px] ${(s.activityTrend ?? 0) >= 0 ? 'text-lms-ok' : 'text-lms-danger'}`}>{dlt(s.activityTrend)}</div>
            </div>
          </div>
          <LineChart data={s.enrollTrend} stroke={p.accent} fill={p.accentSoft} grid={p.line} axis={p.faint}
            labels={chartLabels} />
        </section>

        <section className={`${cardClass(20)} p-[22px]!`}>
          <h3 className="mb-4 mt-0 font-lms-heading text-xl font-medium text-lms-ink">Học liệu nổi bật</h3>
          {(Array.isArray(s.topFiles) && s.topFiles.length
            ? s.topFiles.map((f, i) => ({ key: f._id || f.id || i, name: f.name, meta: `${f.fileType || 'tài liệu'} · 👁 ${f.viewCount ?? 0} · ↓ ${f.downloadCount ?? 0}` }))
            : DB.DOCS.slice(0, 5).map((d) => ({ key: d.id, name: d.name, meta: `${d.folder} · ↓ ${d.downloads}` }))
          ).map((d, i) => (
            <div key={d.key} className={`flex items-center gap-3 py-[11px] ${i ? 'border-t border-lms-line' : ''}`}>
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-lms-accent-soft">
                <Icon name="docs" size={16} stroke={p.accent} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-lms-ink">{d.name}</div>
                <div className="font-mono text-[11px] text-lms-faint">{d.meta}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}


const ROLE_LABEL = { admin: 'Quản trị viên', student: 'Người dùng' };
const fmtJoined = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return '—'; }
};

const ROLE_OPTS = [
  { value: 'student', label: 'Người dùng' },
  { value: 'admin', label: 'Quản trị viên' },
];
const STATUS_OPTS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm ngưng' },
];

export function AUsers({ p, t }) {
  const [busy, setBusy] = React.useState(false);
  const [modal, setModal] = React.useState(null);

  const paged = usePagedResource<any>({ fetcher: usersApi.list, mapper: mapUser });
  const { records: list, loading, error } = paged;

  const roleColor = (r) => ({ 'Người dùng': p.accent, 'Quản trị viên': p.warn }[r] || p.sub);
  const [nAdmin, setNAdmin] = React.useState(0);
  // Total users must be a stable, filter-independent count — paged.total tracks the table's
  // keyword/role/status filters, so use a dedicated query (mirror the nAdmin one).
  const [nUsers, setNUsers] = React.useState(0);
  React.useEffect(() => {
    usersApi.list({ role: 'admin', pageSize: 1 }).then((r: any) => setNAdmin(r?.total ?? 0)).catch(() => {});
    usersApi.list({ pageSize: 1 }).then((r: any) => setNUsers(r?.total ?? 0)).catch(() => {});
  }, []);
  const counts = [['Người dùng', 'users', p.accent, fmt(nUsers)], ['Quản trị viên', 'settings', p.warn, String(nAdmin)]];

  const handleDelete = async (u) => {
    if (!u?.id) return;
    if (!(await confirmDialog({ title: `Xoá người dùng “${u.name}”?`, okText: 'Xoá', danger: true }))) return;
    setBusy(true);
    try { await usersApi.remove(u.id); toastSuccess('Đã xoá người dùng.'); } catch { toastError('Không xoá được người dùng.'); }
    setBusy(false);
    paged.reload();
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
      paged.reload();
      toastSuccess('Đã lưu người dùng.');
      try { await hydrateFor('a-users'); } catch {}
    } catch (e) {
      toastError('Không thể lưu người dùng. Vui lòng kiểm tra dữ liệu hoặc quyền truy cập.');
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-none px-[30px] lms-content-pad pb-10 pt-6">
      <div className="mb-5 grid grid-cols-2 gap-4">
        {counts.map(([r, ic, col, v]) => (
          <div key={r} className={`${cardClass(16)} p-[18px]! flex items-center gap-3.5`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px]" style={{ background: hexA(col, 0.12) }}>
              <Icon name={ic} size={20} stroke={col} />
            </div>
            <div>
              <div className="font-lms-heading text-2xl font-bold leading-none tracking-tight text-lms-ink">{v}</div>
              <div className="mt-1 text-[12.5px] text-lms-sub">{r}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm theo tên, email…" className="w-[240px]" />
        <FilterSelect label="VAI TRÒ" p={p} value={paged.filters.role} options={ROLE_OPTS} onChange={(v) => paged.setFilter('role', v)} />
        <FilterSelect label="TRẠNG THÁI" p={p} value={paged.filters.status} options={STATUS_OPTS} onChange={(v) => paged.setFilter('status', v)} />
        <div className="flex-1" />
        <Btn p={p} variant="ghost" icon="download" onClick={() => downloadCsv('nguoi-dung.csv', [{ key: 'name', label: 'Họ tên' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Vai trò' }, { key: 'status', label: 'Trạng thái' }, { key: 'joined', label: 'Tham gia' }], list)}>Xuất danh sách</Btn>
        <Btn p={p} icon="plus" onClick={() => setModal({ mode: 'create' })}>Thêm người dùng</Btn>
      </div>
      <div className={`lms-scrollx ${cardClass(20)} p-0!`}>
        <Table
          rowKey={(u: any) => u.id || u.email}
          dataSource={list}
          loading={loading}
          locale={{ emptyText: error ? 'Không tải được dữ liệu' : 'Không có kết quả' }}
          pagination={{
            current: paged.current,
            pageSize: paged.pageSize,
            total: paged.total,
            onChange: paged.setPage,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (t) => `tổng ${t.toLocaleString('vi-VN')} người dùng`,
          }}
          columns={[
            {
              title: 'Tên',
              dataIndex: 'name',
              render: (_: any, u: any) => (
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} p={p} size={36} color={roleColor(u.role)} />
                  <div className="text-[13.5px] font-semibold text-lms-ink">{u.name}</div>
                </div>
              ),
            },
            {
              title: 'Email',
              dataIndex: 'email',
              render: (v: any) => <span className="font-mono text-[12px] text-lms-sub">{v}</span>,
            },
            {
              title: 'Vai trò',
              dataIndex: 'role',
              render: (v: any) => <Tag p={p} color={roleColor(v)}>{v}</Tag>,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (v: any) => (
                <Tag p={p} color={v === 'active' ? p.ok : p.faint}>
                  {v === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </Tag>
              ),
            },
            { title: 'Ngày tham gia', dataIndex: 'joined', render: (v: any) => <span className="text-[13px] text-lms-sub">{v}</span> },
            {
              title: 'Thao tác',
              align: 'right' as const,
              render: (_: any, u: any) => (
                <div className="flex justify-end gap-1.5">
                  <button title="Sửa" disabled={!u.id} onClick={() => u.id && setModal({ mode: 'edit', user: u })}
                    className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-lms-line bg-lms-surface ${u.id ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'}`}>
                    <Icon name="pen" size={15} stroke={p.sub} />
                  </button>
                  <button title="Xoá" disabled={!u.id || busy} onClick={() => handleDelete(u)}
                    className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-lms-danger/35 bg-lms-surface ${u.id ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'}`}>
                    <Icon name="trash" size={15} stroke={p.danger} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {modal && (
        <UserFormModal p={p} mode={modal.mode} user={modal.user} busy={busy}
          onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}

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
      <div className="flex flex-col gap-3.5">
        <div><label className={lblClass()}>HỌ TÊN</label><Field p={p} value={name} onChange={setName} placeholder="Nguyễn Văn A" className="mt-2" /></div>
        <div><label className={lblClass()}>EMAIL</label><Field p={p} value={email} onChange={setEmail} placeholder="a@email.com" mono className="mt-2" /></div>
        <div><label className={lblClass()}>MẬT KHẨU{isEdit ? ' (để trống nếu giữ nguyên)' : ''}</label>
          <Field p={p} value={password} onChange={setPassword} type="password" placeholder={isEdit ? '••••••' : 'Tối thiểu 6 ký tự'} className="mt-2" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lblClass()}>VAI TRÒ</label>
            <Select p={p} value={roleVal} onChange={setRoleVal} className="mt-2"
              options={[{ value: 'student', label: 'Người dùng' }, { value: 'admin', label: 'Quản trị viên' }]} /></div>
          <div><label className={lblClass()}>TRẠNG THÁI</label>
            <Select p={p} value={statusVal} onChange={setStatusVal} className="mt-2"
              options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Tạm ngưng' }]} /></div>
        </div>
        <div className="mt-1.5 flex justify-end gap-2.5">
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

const isoDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function AReports({ p, t }) {
  const r = DB.ADMIN_REPORTS || {};
  const [exporting, setExporting] = React.useState('');

  const withReports = React.useCallback(async (fn) => {
    let data = null;
    try { data = await statsApi.reports(); } catch { /* fall back to DB below */ }
    fn(data || DB.ADMIN_REPORTS || {});
  }, []);

  const exportAll = async () => {
    setExporting('all');
    try { await withReports((data) => downloadJson(`bao-cao-tong-hop-${isoDay()}.json`, data)); }
    finally { setExporting(''); }
  };

  const REPORT_CARDS = [
    {
      key: 'distribution', label: 'Phân bố điểm bài nộp', file: 'phan-bo-diem',
      pick: (d) => d?.distribution ?? [],
      cols: [{ key: 'label', label: 'Khoảng điểm' }, { key: 'count', label: 'Số bài' }],
    },
    {
      key: 'perExercise', label: 'Lượt làm theo bài tập', file: 'luot-lam-theo-bai-tap',
      pick: (d) => d?.perExercise ?? [],
      cols: [{ key: 'title', label: 'Bài tập' }, { key: 'attempts', label: 'Lượt làm' }],
    },
    {
      key: 'summary', label: 'Tổng quan chấm bài', file: 'tong-quan-cham-bai',
      pick: (d) => [
        { metric: 'Tổng bài nộp', value: d?.totalSubmissions ?? 0 },
        { metric: 'Đã chấm', value: d?.gradedCount ?? 0 },
        { metric: 'Tỉ lệ chấm (%)', value: d?.submissionRate ?? 0 },
        { metric: 'Điểm trung bình', value: d?.avgScore ?? '—' },
      ],
      cols: [{ key: 'metric', label: 'Chỉ số' }, { key: 'value', label: 'Giá trị' }],
    },
    {
      key: 'practice', label: 'Hoạt động luyện tập', file: 'hoat-dong-luyen-tap',
      pick: (d) => d?.weeklySeries ?? d?.practice?.records ?? d?.practice ?? [],
      cols: [{ key: 'date', label: 'Ngày' }, { key: 'count', label: 'Lượt làm bài' }],
    },
  ];

  const exportCard = async (card) => {
    setExporting(card.key);
    try {
      await withReports((data) => {
        const rows = card.pick(data);
        downloadCsv(`${card.file}-${isoDay()}.csv`, card.cols, Array.isArray(rows) ? rows : []);
      });
    } finally { setExporting(''); }
  };

  const weekdayVi = (iso) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(iso).getDay()];
  const bars = (Array.isArray(r.weeklySeries) && r.weeklySeries.length
    ? r.weeklySeries.map((x) => ({ label: weekdayVi(x.date), value: x.count }))
    : [{ label: 'T2', value: 0 }, { label: 'T3', value: 0 }, { label: 'T4', value: 0 }, { label: 'T5', value: 0 }, { label: 'T6', value: 0 }, { label: 'T7', value: 0 }]
  ).map((b) => ({ ...b, color: p.accent }));
  const maxBar = Math.max(10, ...bars.map((b) => b.value));
  return (
    <div className="mx-auto max-w-none px-[30px] lms-content-pad pb-10 pt-6">
      <div className="grid grid-cols-2 gap-[22px]">
        <section className={`${cardClass(20)} p-[22px]!`}>
          <h3 className="mb-4 mt-0 font-lms-heading text-[19px] font-medium text-lms-ink">Lượt làm bài theo ngày</h3>
          <Bars data={bars} w={520} h={160} track={p.sink} labelColor={p.faint} max={maxBar} />
        </section>
        <section className={`${cardClass(20)} p-[22px]!`}>
          <h3 className="mb-4 mt-0 font-lms-heading text-[19px] font-medium text-lms-ink">Học liệu theo chủ đề</h3>
          {/* NOTE: this counts only the current paginated slice of DB.DOCS, so the per-folder
              totals under-report once the library exceeds one page. The correct fix is a
              backend aggregation (files grouped by folder); left as a follow-up. */}
          <div className="mt-1.5 flex flex-col gap-3">
            {DB.DOC_FOLDERS.filter((f) => f !== 'Tất cả').slice(0, 6).map((f, i) => {
              const n = DB.DOCS.filter((d) => d.folder === f).length;
              const pct = DB.DOCS.length ? Math.round((n / DB.DOCS.length) * 100) : 0;
              const cols = [p.ok, p.info, p.accent, p.warn, p.danger, p.sub];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-[120px] text-[12.5px] text-lms-sub">{f}</span>
                  <div className="flex-1"><Progress p={p} value={pct} height={8} color={cols[i % cols.length]} /></div>
                  <span className="w-9 text-right font-mono text-xs text-lms-faint">{n}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className={`${cardClass(20)} p-[22px]! col-span-full`}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 font-lms-heading text-[19px] font-medium text-lms-ink">Báo cáo có sẵn</h3>
            <Btn p={p} variant="ghost" size="sm" icon="download" onClick={() => { if (!exporting) exportAll(); }}>
              {exporting === 'all' ? 'Đang xuất…' : 'Xuất tất cả'}
            </Btn>
          </div>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {REPORT_CARDS.map((card) => (
              <div key={card.key} onClick={() => { if (!exporting) exportCard(card); }}
                className="lms-row flex cursor-pointer items-center gap-3 rounded-xl border border-lms-line bg-lms-raise p-3.5">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-lms-accent-soft"><Icon name="report" size={18} stroke={p.accent} /></div>
                <span className="flex-1 text-[13px] font-semibold text-lms-ink">{card.label}</span>
                <Icon name="download" size={16} stroke={exporting === card.key ? p.accent : p.faint} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function ASettings({ p, t, setTweak, resetTheme }) {
  const setT = setTweak || (() => {});
  const [sec, setSec] = React.useState('brand');

  const ORG_DEFAULTS = { name: 'Vườn Văn', domain: 'vuonvan.edu.vn', timezone: 'hcm' };
  const tzToOpt = (tz) => (tz === 'Asia/Ho_Chi_Minh' || !tz ? 'hcm' : tz);
  const optToTz = (o) => (o === 'hcm' ? 'Asia/Ho_Chi_Minh' : o);
  const [org, setOrg] = React.useState(ORG_DEFAULTS);
  const [misc, setMisc] = React.useState({ allowGoogleLogin: true });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [homepage, setHomepage] = React.useState({ badge: '', heroTitle: '', heroSubtitle: '', ctaLabel: '' });
  const [seo, setSeo] = React.useState({ title: '', description: '', keywords: '', ogImage: '' });
  const [logoUrl, setLogoUrl] = React.useState('');
  const emptyPage = { title: '', content: '' };
  const [pages, setPages] = React.useState({ about: { ...emptyPage }, guide: { ...emptyPage }, contact: { ...emptyPage }, terms: { ...emptyPage } });
  const [pageTab, setPageTab] = React.useState('about');

  const [academic, setAcademic] = React.useState({ scoreScale: 10, passThreshold: 5, rounding: 'half', allowResubmit: true, showScoreImmediately: true });
  const [security, setSecurity] = React.useState({ twoFactor: true, passwordRotationDays: 0, lockoutThreshold: 5, allowSelfRegister: true, ssoEnabled: true });
  const [notifications, setNotifications] = React.useState({ emailOnSubmit: true, remindUngraded: true, weeklyDigest: false });
  const [integration, setIntegration] = React.useState({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpFrom: '', storageProvider: 's3', apiKey: '', googleClientId: '', googleApiKey: '', aiGemUrl: '' });
  const [data, setData] = React.useState({ autoBackup: true, backupFrequency: 'daily', encryptBackups: true });
  const [restoring, setRestoring] = React.useState(false);
  const restoreInputRef = React.useRef(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await settingsApi.get();
        if (!alive || !s) return;
        if (s.org) {
          setOrg({
            name: s.org.name ?? ORG_DEFAULTS.name,
            domain: s.org.domain ?? '',
            timezone: tzToOpt(s.org.timezone),
          });
          setLogoUrl(s.org.logoUrl ?? '');
        }
        if (s.misc) setMisc({ allowGoogleLogin: s.misc.allowGoogleLogin !== false });
        if (s.homepage) setHomepage({ badge: s.homepage.badge ?? '', heroTitle: s.homepage.heroTitle ?? '', heroSubtitle: s.homepage.heroSubtitle ?? '', ctaLabel: s.homepage.ctaLabel ?? '' });
        if (s.seo) setSeo({ title: s.seo.title ?? '', description: s.seo.description ?? '', keywords: (s.seo.keywords ?? []).join(', '), ogImage: s.seo.ogImage ?? '' });
        if (s.pages) {
          const pick = (k) => ({ title: s.pages[k]?.title ?? '', content: s.pages[k]?.content ?? '' });
          setPages({ about: pick('about'), guide: pick('guide'), contact: pick('contact'), terms: pick('terms') });
        }
        if (s.academic) setAcademic((a) => ({ ...a, ...s.academic }));
        if (s.security) setSecurity((a) => ({ ...a, ...s.security }));
        if (s.notifications) setNotifications((a) => ({ ...a, ...s.notifications }));
        if (s.integration) setIntegration((a) => ({ ...a, ...s.integration }));
        if (s.data) setData((a) => ({ ...a, ...s.data }));
      } catch { /* API down / not authed → keep defaults */ }
    })();
    return () => { alive = false; };
  }, []);

  const saveGroup = React.useCallback(async (group) => {
    setSaving(true);
    try {
      await settingsApi.update(group);
      if (group && group.org) refreshOrgBrand(); // logo/name changed → refresh chrome
      if (group && group.integration) { refreshGoogleConfig(); refreshAiGemUrl(); } // Google keys / Gem link changed → refresh
      setSaved(true);
      if (typeof window !== 'undefined') window.setTimeout(() => setSaved(false), 2500);
    } catch {
      toastError('Không thể lưu cấu hình. Vui lòng kiểm tra quyền truy cập.');
    }
    setSaving(false);
  }, []);

  const Toggle = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between rounded-xl border border-lms-line bg-lms-raise px-3.5 py-[11px]">
      <span className="text-[13.5px] text-lms-ink">{label}</span>
      <div onClick={() => onChange(!value)}
        className={`flex h-6 w-[42px] cursor-pointer rounded-xl p-0.5 transition-colors ${value ? 'bg-lms-accent justify-end' : 'bg-lms-sink justify-start'}`}>
        <div className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]" />
      </div>
    </div>
  );

  const SaveRow = ({ onSave }) => (
    <div className="mt-5 flex items-center justify-end gap-3 border-t border-lms-line-soft pt-4">
      {saved && (
        <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-lms-ok">
          <Icon name="checkCircle" size={15} stroke={p.ok} /> Đã lưu
        </span>
      )}
      <Btn p={p} icon="check" onClick={() => { if (!saving) onSave(); }}>Lưu thay đổi</Btn>
    </div>
  );

  const changeLogo = async () => {
    const trimmed = (await promptDialog({
      title: 'Đổi logo',
      label: 'Dán URL logo (https://...)',
      defaultValue: logoUrl || '',
      placeholder: 'https://…/logo.png',
      okText: 'Lưu logo',
      validate: (v) => (/^https?:\/\//i.test(v) ? null : 'URL logo phải bắt đầu bằng http hoặc https.'),
    }))?.trim();
    if (!trimmed) return;
    setLogoUrl(trimmed);
    await saveGroup({ org: { logoUrl: trimmed } });
    toastSuccess('Đã cập nhật logo.');
  };

  const regenApiKey = async () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `vv_${hex}`;
    setIntegration((o) => ({ ...o, apiKey }));
    await saveGroup({ integration: { apiKey } });
  };

  const backupNow = async () => {
    try {
      const snap = await settingsApi.export();
      const day = String(snap?.exportedAt || '').slice(0, 10) || 'backup';
      downloadJson(`vuonvan-backup-${day}.json`, snap);
      toastSuccess('Đã tạo tệp sao lưu.');
    } catch {
      toastError('Không thể sao lưu. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const onRestoreFile = async (e) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = '';
    if (!file) return;
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toastError('Tệp sao lưu không hợp lệ (không phải JSON).');
      return;
    }
    if (!(await confirmDialog({ title: 'Khôi phục dữ liệu?', content: 'Khôi phục sẽ ghi đè nội dung hiện tại. Tiếp tục?', okText: 'Khôi phục', danger: true }))) return;
    setRestoring(true);
    try {
      const res = await settingsApi.import(parsed);
      const total = Object.values(res?.restored || {}).reduce((a, n) => a + (Number(n) || 0), 0);
      notifySuccess('Khôi phục thành công', `Đã khôi phục ${total.toLocaleString('vi-VN')} bản ghi.`);
    } catch {
      toastError('Không thể khôi phục. Vui lòng kiểm tra tệp và quyền truy cập.');
    }
    setRestoring(false);
  };

  const saveSettings = React.useCallback(async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        org: { name: org.name, domain: org.domain, timezone: optToTz(org.timezone) },
        misc: { allowGoogleLogin: misc.allowGoogleLogin },
      });
      refreshOrgBrand(); // org name may have changed
      setSaved(true);
      if (typeof window !== 'undefined') window.setTimeout(() => setSaved(false), 2500);
    } catch {
      toastError('Không thể lưu cấu hình. Vui lòng kiểm tra quyền truy cập.');
    }
    setSaving(false);
  }, [org, misc]);
  // Gom 10 nhóm cài đặt thành 4 tab cho gọn. Mỗi tab hiển thị nhiều mục con xếp chồng
  // (mỗi mục vẫn có nút Lưu riêng): Giao diện & Thương hiệu (giao diện + tổ chức) ·
  // Nội dung & SEO (trang chủ + trang nội dung + SEO) · Đánh giá · Hệ thống (bảo mật +
  // thông báo + tích hợp + dữ liệu & sao lưu).
  const SECTIONS = [
    { id: 'brand', icon: 'image', label: 'Giao diện & Thương hiệu' },
    { id: 'content', icon: 'docs', label: 'Nội dung & SEO' },
    { id: 'academic', icon: 'grade', label: 'Đánh giá' },
    { id: 'system', icon: 'settings', label: 'Hệ thống' },
  ];
  const ACCENT_OPTS = [
    { k: 'grass', hex: '#3f9d5c', label: 'Xanh lá' },
    { k: 'sky', hex: '#2f7fe0', label: 'Xanh dương' },
    { k: 'coral', hex: '#ec6238', label: 'Cam' },
    { k: 'amber', hex: '#d98a12', label: 'Vàng' },
    { k: 'grape', hex: '#8a52d6', label: 'Tím' },
  ];
  const AR = ({ label, desc, children }) => (
    <div className="flex items-center justify-between gap-4 border-t border-lms-line-soft py-3.5">
      <div>
        <div className="text-[13.5px] font-semibold text-lms-ink">{label}</div>
        {desc && <div className="mt-0.5 text-xs text-lms-faint">{desc}</div>}
      </div>
      {children}
    </div>
  );
  const H = ({ children, desc }) => (
    <div className="mb-[18px]">
      <h3 className="m-0 font-lms-heading text-lg font-semibold text-lms-ink">{children}</h3>
      {desc && <div className="mt-[3px] text-[12.5px] text-lms-faint">{desc}</div>}
    </div>
  );
  return (
    <div className="mx-auto grid max-w-none grid-cols-1 items-start gap-6 px-[30px] lms-content-pad pb-10 pt-6 min-[961px]:grid-cols-[230px_1fr]">
      <aside className={`${cardClass(16)} p-2! sticky top-0`}>
        {SECTIONS.map((s) => {
          const on = sec === s.id;
          return (
            <div key={s.id} onClick={() => setSec(s.id)} className={`lms-nav-item mb-0.5 flex cursor-pointer items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-[13.5px] ${on ? 'bg-lms-active-bg font-semibold text-lms-accent' : 'font-medium text-lms-sub'}`}>
              <Icon name={s.icon} size={17} stroke={on ? p.accent : p.faint} /> <span>{s.label}</span>
            </div>
          );
        })}
      </aside>

      <div className="flex flex-col gap-5">
        {sec === 'brand' && (
          <section className={cardClass(24)}>
            <H desc="Tuỳ chỉnh màu thương hiệu, phông chữ và bố cục — áp dụng tức thì cho toàn hệ thống và được lưu lại.">Giao diện & thương hiệu</H>
            <div className="mb-6 overflow-hidden rounded-xl border border-lms-line">
              <div className="flex items-center gap-[11px] border-b border-lms-line-soft bg-lms-rail-bg px-4 py-3">
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-lms-accent font-lms-heading text-base font-bold text-white">V</div>
                <div className="font-lms-heading text-[15.5px] font-bold text-lms-ink">Vườn Văn</div>
                <div className="ml-auto"><Tag p={p} color={p.accent}>Bản xem trước</Tag></div>
              </div>
              <div className="flex flex-wrap items-center gap-3 bg-lms-bg p-4">
                <Btn p={p}>Nút chính</Btn>
                <Btn p={p} variant="soft" icon="plus">Tạo mới</Btn>
                <Btn p={p} variant="ghost">Phụ</Btn>
                <div className="min-w-[150px] flex-1"><Progress p={p} value={68} /></div>
              </div>
            </div>
            <div className="mb-6">
              <label className={lblClass()}>MÀU CHỦ ĐẠO</label>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {ACCENT_OPTS.map((o) => {
                  const on = t.accent === o.k;
                  return (
                    <button key={o.k} onClick={() => setT({ accent: o.k })} title={o.label}
                      className="flex h-[38px] cursor-pointer items-center gap-[9px] rounded-[11px] px-[14px] pl-2.5 text-[13px] font-semibold"
                      style={{ border: `1.5px solid ${on ? o.hex : 'var(--lms-line)'}`, background: on ? hexA(o.hex, 0.1) : 'var(--lms-surface)', color: on ? o.hex : 'var(--lms-sub)' }}>
                      <span className="h-[18px] w-[18px] rounded-md" style={{ background: o.hex }} /> {o.label}
                    </button>
                  );
                })}
                <label className="relative flex h-[38px] cursor-pointer items-center gap-[9px] rounded-[11px] px-[14px] pl-2.5 text-[13px] font-semibold"
                  style={{ border: `1.5px solid ${t.accent === 'custom' ? (t.accentHex || p.accent) : 'var(--lms-line)'}`, background: t.accent === 'custom' ? hexA(t.accentHex || p.accent, 0.1) : 'var(--lms-surface)', color: t.accent === 'custom' ? (t.accentHex || p.accent) : 'var(--lms-sub)' }}>
                  <span className="h-[18px] w-[18px] rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: t.accentHex || p.accent }} />
                  Tuỳ chỉnh
                  <input type="color" value={t.accentHex || p.accent} onChange={(e) => setT({ accent: 'custom', accentHex: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                </label>
              </div>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-5">
              <div>
                <label className={lblClass()}>PHÔNG TIÊU ĐỀ</label>
                <Select p={p} value={t.headingFont} className="mt-2" onChange={(v) => setT({ headingFont: v })}
                  options={[{ value: 'baloo', label: 'Baloo 2 — bo tròn, thân thiện' }, { value: 'jakarta', label: 'Plus Jakarta Sans' }, { value: 'sora', label: 'Sora' }, { value: 'system', label: 'Hệ thống' }]} />
                <div className="mt-3 font-lms-heading text-[21px] font-bold tracking-tight text-lms-ink">Học hay mỗi ngày</div>
              </div>
              <div>
                <label className={lblClass()}>CHẾ ĐỘ HIỂN THỊ</label>
                <div className="mt-2">
                  <Segmented p={p} value={!!t.dark} onChange={(v) => setT({ dark: v })}
                    options={[{ value: false, label: 'Sáng', icon: 'sun' }, { value: true, label: 'Tối', icon: 'moon' }]} />
                </div>
              </div>
            </div>
            <label className={lblClass()}>BỐ CỤC</label>
            <div className="mt-1">
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

            <div className="mt-[22px] flex items-center justify-between border-t border-lms-line-soft pt-[18px]">
              <div className="flex items-center gap-[7px] font-mono text-[11.5px] text-lms-faint">
                <Icon name="checkCircle" size={15} stroke={p.ok} /> Thay đổi được lưu tự động
              </div>
              <Btn p={p} variant="ghost" onClick={() => resetTheme && resetTheme()}>Khôi phục mặc định</Btn>
            </div>
          </section>
        )}

        {sec === 'brand' && (
          <section className={cardClass(24)}>
            <H desc="Thông tin chung của trung tâm hiển thị trên toàn hệ thống.">Tổ chức</H>
            <div className="mb-[18px] flex items-center gap-4">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl border border-lms-line object-cover" />
                : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-lms-accent font-lms-heading text-[28px] font-bold text-white">V</div>}
              <Btn p={p} variant="ghost" icon="upload" onClick={changeLogo}>Đổi logo</Btn>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lblClass()}>TÊN TRUNG TÂM</label><Field p={p} value={org.name} onChange={(v) => setOrg((o) => ({ ...o, name: v }))} className="mt-2" /></div>
              <div><label className={lblClass()}>TÊN MIỀN</label><Field p={p} value={org.domain} onChange={(v) => setOrg((o) => ({ ...o, domain: v }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>MÚI GIỜ</label><Select p={p} value={org.timezone} onChange={(v) => setOrg((o) => ({ ...o, timezone: v }))} className="mt-2" options={[{ value: 'hcm', label: '(GMT+7) Hồ Chí Minh' }]} /></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-lms-line bg-lms-raise px-3.5 py-3">
              <span className="text-[13.5px] text-lms-ink">Cho phép đăng nhập bằng Google (SSO)</span>
              <Segmented p={p} value={!!misc.allowGoogleLogin} onChange={(v) => setMisc((m) => ({ ...m, allowGoogleLogin: v }))}
                options={[{ value: true, label: 'Bật' }, { value: false, label: 'Tắt' }]} />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-lms-line-soft pt-4">
              {saved && (
                <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-lms-ok">
                  <Icon name="checkCircle" size={15} stroke={p.ok} /> Đã lưu
                </span>
              )}
              <Btn p={p} icon="check" onClick={() => { if (!saving) saveSettings(); }}>Lưu thay đổi</Btn>
            </div>
          </section>
        )}

        {sec === 'system' && (
          <section className={cardClass(24)}>
            <H desc="Chính sách đăng nhập và bảo vệ tài khoản toàn hệ thống.">Bảo mật & đăng nhập</H>
            <div className="mb-[18px] flex flex-col gap-2.5">
              <Toggle label="Xác thực hai lớp (2FA) bắt buộc cho quản trị" value={security.twoFactor} onChange={(v) => setSecurity((o) => ({ ...o, twoFactor: v }))} />
              <Toggle label="Cho phép đăng nhập bằng SSO" value={security.ssoEnabled} onChange={(v) => setSecurity((o) => ({ ...o, ssoEnabled: v }))} />
              <Toggle label="Cho phép người dùng tự đăng ký" value={security.allowSelfRegister} onChange={(v) => setSecurity((o) => ({ ...o, allowSelfRegister: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lblClass()}>BẮT BUỘC ĐỔI MẬT KHẨU SAU (NGÀY, 0 = TẮT)</label><Field p={p} value={String(security.passwordRotationDays)} onChange={(v) => setSecurity((o) => ({ ...o, passwordRotationDays: parseInt(v, 10) || 0 }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>KHOÁ TÀI KHOẢN SAU SỐ LẦN SAI</label><Field p={p} value={String(security.lockoutThreshold)} onChange={(v) => setSecurity((o) => ({ ...o, lockoutThreshold: parseInt(v, 10) || 0 }))} mono className="mt-2" /></div>
            </div>
            <SaveRow onSave={() => saveGroup({ security })} />
          </section>
        )}

        {sec === 'academic' && (
          <section className={cardClass(24)}>
            <H desc="Quy định chấm điểm & đánh giá áp dụng toàn hệ thống.">Cấu hình đánh giá</H>
            <div className="mb-[18px] grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className={lblClass()}>THANG ĐIỂM</label><Select p={p} value={String(academic.scoreScale)} onChange={(v) => setAcademic((o) => ({ ...o, scoreScale: parseInt(v, 10) || 10 }))} className="mt-2" options={[{ value: '10', label: 'Hệ 10' }, { value: '100', label: 'Hệ 100' }]} /></div>
              <div><label className={lblClass()}>ĐIỂM ĐẠT TỐI THIỂU</label><Field p={p} value={String(academic.passThreshold)} onChange={(v) => setAcademic((o) => ({ ...o, passThreshold: parseFloat(v.replace(',', '.')) || 0 }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>LÀM TRÒN</label><Select p={p} value={academic.rounding} onChange={(v) => setAcademic((o) => ({ ...o, rounding: v }))} className="mt-2" options={[{ value: 'none', label: 'Không' }, { value: 'half', label: 'Đến 0,5' }, { value: 'integer', label: 'Số nguyên' }]} /></div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Toggle label="Cho phép người dùng nộp lại" value={academic.allowResubmit} onChange={(v) => setAcademic((o) => ({ ...o, allowResubmit: v }))} />
              <Toggle label="Hiển thị điểm ngay sau khi nộp" value={academic.showScoreImmediately} onChange={(v) => setAcademic((o) => ({ ...o, showScoreImmediately: v }))} />
            </div>
            <SaveRow onSave={() => saveGroup({ academic })} />
          </section>
        )}

        {sec === 'system' && (
          <section className={cardClass(24)}>
            <H desc="Kênh và quy tắc gửi thông báo cho người dùng.">Thông báo</H>
            <div className="mb-[18px] flex flex-col gap-2.5">
              <Toggle label="Gửi email khi có bài nộp" value={notifications.emailOnSubmit} onChange={(v) => setNotifications((o) => ({ ...o, emailOnSubmit: v }))} />
              <Toggle label="Nhắc giáo viên bài chưa chấm" value={notifications.remindUngraded} onChange={(v) => setNotifications((o) => ({ ...o, remindUngraded: v }))} />
              <Toggle label="Gửi báo cáo tổng hợp hằng tuần cho quản trị" value={notifications.weeklyDigest} onChange={(v) => setNotifications((o) => ({ ...o, weeklyDigest: v }))} />
            </div>
            <SaveRow onSave={() => saveGroup({ notifications })} />
          </section>
        )}

        {sec === 'system' && (
          <section className={cardClass(24)}>
            <H desc="Kết nối email, lưu trữ và API bên ngoài.">Tích hợp</H>
            <div className="mb-[18px] grid grid-cols-2 gap-4">
              <div><label className={lblClass()}>MÁY CHỦ EMAIL (SMTP)</label><Field p={p} value={integration.smtpHost} onChange={(v) => setIntegration((o) => ({ ...o, smtpHost: v }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>CỔNG SMTP</label><Field p={p} value={integration.smtpPort == null ? '' : String(integration.smtpPort)} onChange={(v) => setIntegration((o) => { const n = parseInt(v, 10); return { ...o, smtpPort: Number.isFinite(n) && n > 0 ? n : null }; })} mono className="mt-2" /></div>
              <div><label className={lblClass()}>TÀI KHOẢN SMTP</label><Field p={p} value={integration.smtpUser} onChange={(v) => setIntegration((o) => ({ ...o, smtpUser: v }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>EMAIL GỬI ĐI (FROM)</label><Field p={p} value={integration.smtpFrom} onChange={(v) => setIntegration((o) => ({ ...o, smtpFrom: v }))} mono className="mt-2" /></div>
              <div><label className={lblClass()}>DỊCH VỤ LƯU TRỮ</label><Select p={p} value={integration.storageProvider} onChange={(v) => setIntegration((o) => ({ ...o, storageProvider: v }))} className="mt-2" options={[{ value: 's3', label: 'Amazon S3' }, { value: 'local', label: 'Máy chủ nội bộ' }]} /></div>
            </div>
            <label className={lblClass()}>API KEY</label>
            <div className="mt-2 flex gap-2.5">
              <Field p={p} value={integration.apiKey || ''} onChange={(v) => setIntegration((o) => ({ ...o, apiKey: v }))} placeholder="(chưa tạo)" mono className="flex-1" />
              <Btn p={p} variant="ghost" icon="copy" onClick={regenApiKey}>Tạo lại</Btn>
            </div>
            <div className="mt-6 border-t border-lms-line-soft pt-5">
              <div className="mb-1 text-[13.5px] font-semibold text-lms-ink">Google (Đăng nhập &amp; Drive Picker)</div>
              <p className="mb-3.5 mt-0 text-[12.5px] leading-relaxed text-lms-sub">Client ID + API Key dùng cho nút “Kéo từ Google Drive” và đăng nhập Google. Lưu ở đây thì không cần build lại; để trống sẽ dùng biến môi trường NEXT_PUBLIC_GOOGLE_*.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lblClass()}>GOOGLE CLIENT ID</label><Field p={p} value={integration.googleClientId || ''} onChange={(v) => setIntegration((o) => ({ ...o, googleClientId: v }))} placeholder="…apps.googleusercontent.com" mono className="mt-2" /></div>
                <div><label className={lblClass()}>GOOGLE API KEY</label><Field p={p} value={integration.googleApiKey || ''} onChange={(v) => setIntegration((o) => ({ ...o, googleApiKey: v }))} placeholder="AIza…" mono className="mt-2" /></div>
              </div>
            </div>
            <div className="mt-6 border-t border-lms-line-soft pt-5">
              <div className="mb-1 text-[13.5px] font-semibold text-lms-ink">Trợ lý AI góp ý (Gemini Gem)</div>
              <p className="mb-3.5 mt-0 text-[12.5px] leading-relaxed text-lms-sub">Dán link Gemini Gem để hiện nút “Nhờ AI góp ý” ở trang Tự đánh giá và màn Chấm bài. Để trống sẽ ẩn nút.</p>
              <div><label className={lblClass()}>LINK GEMINI GEM</label><Field p={p} value={integration.aiGemUrl || ''} onChange={(v) => setIntegration((o) => ({ ...o, aiGemUrl: v }))} placeholder="https://gemini.google.com/gem/…" mono className="mt-2" /></div>
            </div>
            {/* Omit apiKey: GET /settings redacts it to null, so re-sending it here would $set
                null over the real stored key. The dedicated “Tạo lại” (regenApiKey) path saves
                the key on its own. */}
            <SaveRow onSave={() => saveGroup({ integration: { smtpHost: integration.smtpHost, smtpPort: integration.smtpPort, smtpUser: integration.smtpUser, smtpFrom: integration.smtpFrom, storageProvider: integration.storageProvider, googleClientId: integration.googleClientId, googleApiKey: integration.googleApiKey, aiGemUrl: integration.aiGemUrl } })} />
          </section>
        )}

        {sec === 'content' && (
          <section className={cardClass(24)}>
            <H desc="Nội dung hiển thị ngoài trang chủ công khai (admin tự chỉnh).">Trang chủ</H>
            <div className="flex flex-col gap-4">
              <div><label className={lblClass()}>NHÃN (BADGE)</label><Field p={p} value={homepage.badge} onChange={(v) => setHomepage((o) => ({ ...o, badge: v }))} className="mt-2" /></div>
              <div><label className={lblClass()}>TIÊU ĐỀ HERO</label><Field p={p} value={homepage.heroTitle} onChange={(v) => setHomepage((o) => ({ ...o, heroTitle: v }))} className="mt-2" /></div>
              <div>
                <label className={lblClass()}>MÔ TẢ HERO</label>
                <textarea value={homepage.heroSubtitle} onChange={(e) => setHomepage((o) => ({ ...o, heroSubtitle: e.target.value }))}
                  className="mt-2 box-border min-h-[70px] w-full resize-y rounded-xl border border-lms-line bg-lms-surface p-3 font-sans text-sm text-lms-ink outline-none" />
              </div>
              <div className="max-w-[280px]"><label className={lblClass()}>NHÃN NÚT (CTA)</label><Field p={p} value={homepage.ctaLabel} onChange={(v) => setHomepage((o) => ({ ...o, ctaLabel: v }))} className="mt-2" /></div>
            </div>
          </section>
        )}

        {sec === 'content' && (
          <section className={cardClass(24)}>
            <H desc="Nội dung 4 trang tĩnh ở chân trang: Giới thiệu, Hướng dẫn sử dụng, Liên hệ, Điều khoản.">Trang nội dung</H>
            <div className="mb-4 flex flex-wrap gap-2">
              {[{ id: 'about', label: 'Giới thiệu' }, { id: 'guide', label: 'Hướng dẫn sử dụng' }, { id: 'contact', label: 'Liên hệ' }, { id: 'terms', label: 'Điều khoản' }].map((pt) => (
                <Pill key={pt.id} p={p} active={pageTab === pt.id} onClick={() => setPageTab(pt.id)}>{pt.label}</Pill>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={lblClass()}>TIÊU ĐỀ TRANG</label>
                <Field p={p} value={pages[pageTab].title} onChange={(v) => setPages((o) => ({ ...o, [pageTab]: { ...o[pageTab], title: v } }))} className="mt-2" /></div>
              <div><label className={lblClass()}>NỘI DUNG</label>
                <div className="mt-2"><RichEditor value={pages[pageTab].content} onChange={(v) => setPages((o) => ({ ...o, [pageTab]: { ...o[pageTab], content: v } }))} placeholder="Soạn nội dung trang…" /></div></div>
            </div>
            <SaveRow onSave={() => saveGroup({ pages: { [pageTab]: pages[pageTab] } })} />
          </section>
        )}

        {sec === 'content' && (
          <section className={cardClass(24)}>
            <H desc="Thẻ tiêu đề, mô tả và từ khóa cho trang công khai.">SEO</H>
            <div className="flex flex-col gap-4">
              <div><label className={lblClass()}>TIÊU ĐỀ TRANG (TITLE)</label><Field p={p} value={seo.title} onChange={(v) => setSeo((o) => ({ ...o, title: v }))} className="mt-2" /></div>
              <div>
                <label className={lblClass()}>MÔ TẢ (DESCRIPTION)</label>
                <textarea value={seo.description} onChange={(e) => setSeo((o) => ({ ...o, description: e.target.value }))}
                  className="mt-2 box-border min-h-16 w-full resize-y rounded-xl border border-lms-line bg-lms-surface p-3 font-sans text-sm text-lms-ink outline-none" />
              </div>
              <div><label className={lblClass()}>TỪ KHÓA (cách nhau bằng dấu phẩy)</label><Field p={p} value={seo.keywords} onChange={(v) => setSeo((o) => ({ ...o, keywords: v }))} className="mt-2" /></div>
              <div><label className={lblClass()}>ẢNH OG (URL)</label><Field p={p} value={seo.ogImage} onChange={(v) => setSeo((o) => ({ ...o, ogImage: v }))} mono className="mt-2" /></div>
            </div>
          </section>
        )}

        {sec === 'system' && (
          <section className={cardClass(24)}>
            <H desc="Sao lưu tự động toàn hệ thống.">Dữ liệu & sao lưu</H>
            <div className="mb-[18px] grid grid-cols-2 gap-4">
              <div><label className={lblClass()}>TẦN SUẤT SAO LƯU</label><Select p={p} value={data.backupFrequency} onChange={(v) => setData((o) => ({ ...o, backupFrequency: v }))} className="mt-2" options={[{ value: 'daily', label: 'Hằng ngày' }, { value: 'weekly', label: 'Hằng tuần' }, { value: 'monthly', label: 'Hằng tháng' }]} /></div>
            </div>
            <div className="mb-[18px] flex flex-col gap-2.5">
              <Toggle label="Tự động sao lưu" value={data.autoBackup} onChange={(v) => setData((o) => ({ ...o, autoBackup: v }))} />
              <Toggle label="Mã hoá dữ liệu sao lưu" value={data.encryptBackups} onChange={(v) => setData((o) => ({ ...o, encryptBackups: v }))} />
            </div>
            <div className="flex gap-2.5">
              <Btn p={p} icon="download" onClick={backupNow}>Sao lưu ngay</Btn>
              <Btn p={p} variant="ghost" icon="upload" onClick={() => restoreInputRef.current?.click()}>{restoring ? 'Đang khôi phục…' : 'Khôi phục'}</Btn>
              <input ref={restoreInputRef} type="file" accept=".json,application/json" onChange={onRestoreFile} className="hidden" />
            </div>
            <SaveRow onSave={() => saveGroup({ data })} />
          </section>
        )}

        {sec === 'content' && (
          <div className="flex items-center justify-end gap-2.5">
            {saved && (
              <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-lms-ok">
                <Icon name="checkCircle" size={15} stroke={p.ok} /> Đã lưu
              </span>
            )}
            <Btn p={p} icon="check" onClick={() => { if (!saving) saveGroup({
              homepage: { badge: homepage.badge, heroTitle: homepage.heroTitle, heroSubtitle: homepage.heroSubtitle, ctaLabel: homepage.ctaLabel },
              seo: { title: seo.title, description: seo.description, keywords: seo.keywords.split(',').map((x) => x.trim()).filter(Boolean), ogImage: seo.ogImage || undefined },
            }); }}>Lưu thay đổi</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
