'use client';
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, EmptyState } from '@/app/components/ui';
import { hexA } from '@/app/theme/palette';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { classesApi, usersApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';

// Modal shell — same idiom as admin.tsx's AdminModal (kept local to this screen).
function ClassModal({ p, title, onClose, children, max = 460 }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(15,23,38,0.5)] p-5">
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: max }}
        className="w-full overflow-hidden rounded-[14px] border border-lms-line bg-lms-surface shadow-[0_24px_60px_rgba(15,23,38,0.28)]">
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

export function AClasses({ p, t }) {
  const [classes, setClasses] = React.useState<any[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [modal, setModal] = React.useState<any>(null);      // { mode:'create'|'edit', cls? }
  const [students, setStudents] = React.useState<any>(null); // { cls } → opens the students drawer

  const refetch = React.useCallback(async () => {
    try {
      const res: any = await classesApi.list({ pageSize: 200 });
      const records: any[] = res?.records ?? (Array.isArray(res) ? res : []);
      setClasses(records.map((c) => ({
        id: c._id || c.id,
        name: c.name,
        grade: c.grade ?? '',
        description: c.description ?? '',
        code: c.code ?? '',
        studentCount: c.studentCount ?? c.enrolledCount ?? 0,
      })));
    } catch {
      setClasses([]);
    }
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  const list = classes ?? [];

  const handleDelete = async (c) => {
    if (!c?.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`Xoá lớp "${c.name}"? Mọi ghi danh của lớp sẽ bị gỡ.`)) return;
    setBusy(true);
    try { await classesApi.remove(c.id); } catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không xoá được lớp.'); }
    setBusy(false);
    await refetch();
    try { await hydrateFor('a-classes'); } catch {}
  };

  const handleSave = async (form, mode, editId) => {
    setBusy(true);
    try {
      const body: any = { name: form.name, grade: form.grade || undefined, description: form.description || undefined, code: form.code || undefined };
      if (mode === 'edit' && editId) await classesApi.update(editId, body);
      else await classesApi.create(body);
      setModal(null);
      await refetch();
      try { await hydrateFor('a-classes'); } catch {}
    } catch (e: any) {
      if (typeof window !== 'undefined') window.alert(e?.message || 'Không thể lưu lớp. Vui lòng kiểm tra dữ liệu hoặc quyền truy cập.');
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pb-10 pt-6">
      <div className="mb-5 grid grid-cols-2 gap-4">
        {[['Số lớp', 'users', p.accent, String(list.length)],
          ['Tổng ghi danh', 'users', p.warn, String(list.reduce((s, c) => s + (c.studentCount || 0), 0))]].map(([r, ic, col, v]) => (
          <div key={r as string} className={`${cardClass(16)} p-[18px]! flex items-center gap-3.5`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px]" style={{ background: hexA(col as string, 0.12) }}>
              <Icon name={ic as string} size={20} stroke={col as string} />
            </div>
            <div>
              <div className="font-lms-heading text-2xl font-bold leading-none tracking-tight text-lms-ink">{v}</div>
              <div className="mt-1 text-[12.5px] text-lms-sub">{r}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Pill p={p} active>Tất cả · {list.length}</Pill>
        <div className="flex-1" />
        <Btn p={p} icon="plus" onClick={() => setModal({ mode: 'create' })}>Tạo lớp</Btn>
      </div>

      {list.length === 0 ? (
        <div className={`${cardClass(20)}`}>
          <EmptyState p={p} icon="users" label="Chưa có lớp học nào" sub="Tạo lớp đầu tiên để bắt đầu ghi danh học viên và gán bài theo lớp."
            action={<Btn p={p} icon="plus" onClick={() => setModal({ mode: 'create' })}>Tạo lớp</Btn>} />
        </div>
      ) : (
        <div className={`lms-scrollx ${cardClass(20)} p-0!`}>
          <div className="grid grid-cols-[2.4fr_0.8fr_1fr_0.9fr_120px] border-b border-lms-line px-[22px] py-3 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">
            <span>LỚP</span><span>KHỐI</span><span>MÃ THAM GIA</span><span>HỌC VIÊN</span><span className="text-right">THAO TÁC</span>
          </div>
          {list.map((c, i) => (
            <div key={c.id || i} className={`lms-row grid grid-cols-[2.4fr_0.8fr_1fr_0.9fr_120px] items-center px-[22px] py-[13px] ${i ? 'border-t border-lms-line-soft' : ''}`}>
              <div className="flex items-center gap-3">
                <Avatar name={c.name} p={p} size={36} color={p.accent} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-lms-ink">{c.name}</div>
                  {c.description && <div className="truncate text-[11.5px] text-lms-faint">{c.description}</div>}
                </div>
              </div>
              <div className="text-[13px] text-lms-sub">{c.grade ? `Khối ${c.grade}` : '—'}</div>
              <div>{c.code ? <Tag p={p} color={p.sub}>{c.code}</Tag> : <span className="text-[13px] text-lms-faint">—</span>}</div>
              <div>
                <button onClick={() => setStudents({ cls: c })}
                  className="lms-link inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-[13px] text-lms-accent">
                  <Icon name="users" size={15} stroke={p.accent} /> {c.studentCount || 0} học viên
                </button>
              </div>
              <div className="flex justify-end gap-1.5">
                <button title="Sửa" onClick={() => setModal({ mode: 'edit', cls: c })}
                  className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-lms-line bg-lms-surface">
                  <Icon name="pen" size={15} stroke={p.sub} />
                </button>
                <button title="Xoá" disabled={busy} onClick={() => handleDelete(c)}
                  className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-lms-danger/35 bg-lms-surface">
                  <Icon name="trash" size={15} stroke={p.danger} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ClassFormModal p={p} mode={modal.mode} cls={modal.cls} busy={busy}
          onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {students && (
        <ClassStudentsModal p={p} cls={students.cls}
          onClose={() => { setStudents(null); refetch(); }} />
      )}
    </div>
  );
}

function ClassFormModal({ p, mode, cls, busy, onClose, onSave }) {
  const [name, setName] = React.useState(cls?.name || '');
  const [grade, setGrade] = React.useState(cls?.grade || '');
  const [code, setCode] = React.useState(cls?.code || '');
  const [description, setDescription] = React.useState(cls?.description || '');
  const isEdit = mode === 'edit';
  const canSave = name.trim().length >= 1;
  return (
    <ClassModal p={p} title={isEdit ? 'Sửa lớp học' : 'Tạo lớp học'} onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <div><label className={lblClass()}>TÊN LỚP</label><Field p={p} value={name} onChange={setName} placeholder="vd: Lớp 5A — Ngữ văn" className="mt-2" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={lblClass()}>KHỐI</label>
            <Select p={p} value={grade} onChange={setGrade} className="mt-2"
              options={[{ value: '', label: '— Không chọn —' }, { value: '1', label: 'Khối 1' }, { value: '2', label: 'Khối 2' }, { value: '3', label: 'Khối 3' }, { value: '4', label: 'Khối 4' }, { value: '5', label: 'Khối 5' }]} /></div>
          <div><label className={lblClass()}>MÃ THAM GIA (tuỳ chọn)</label><Field p={p} value={code} onChange={setCode} placeholder="vd: 5A2026" mono className="mt-2" /></div>
        </div>
        <div>
          <label className={lblClass()}>MÔ TẢ (tuỳ chọn)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú về lớp…"
            className="mt-2 box-border min-h-[64px] w-full resize-y rounded-xl border border-lms-line bg-lms-surface p-3 font-sans text-sm text-lms-ink outline-none" />
        </div>
        <div className="mt-1.5 flex justify-end gap-2.5">
          <Btn p={p} variant="ghost" onClick={onClose}>Huỷ</Btn>
          <Btn p={p} icon="check"
            onClick={() => { if (canSave && !busy) onSave({ name: name.trim(), grade, code: code.trim(), description: description.trim() }, mode, cls?.id); }}>
            {isEdit ? 'Lưu' : 'Tạo lớp'}
          </Btn>
        </div>
      </div>
    </ClassModal>
  );
}

function ClassStudentsModal({ p, cls, onClose }) {
  const [enrolled, setEnrolled] = React.useState<any[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [adding, setAdding] = React.useState(false);      // toggles the "add students" picker
  const [candidates, setCandidates] = React.useState<any[] | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');

  const loadEnrolled = React.useCallback(async () => {
    try {
      const res: any = await classesApi.students(cls.id);
      const records: any[] = res?.records ?? (Array.isArray(res) ? res : []);
      setEnrolled(records.map((s) => ({ id: s._id || s.id || s.studentId, name: s.name, email: s.email })));
    } catch {
      setEnrolled([]);
    }
  }, [cls.id]);

  React.useEffect(() => { loadEnrolled(); }, [loadEnrolled]);

  const openAdd = async () => {
    setAdding(true);
    setPicked([]);
    try {
      const res: any = await usersApi.list({ role: 'student', pageSize: 200 });
      const records: any[] = res?.records ?? [];
      setCandidates(records.map((u) => ({ id: u._id || u.id, name: u.name, email: u.email })));
    } catch {
      setCandidates([]);
    }
  };

  const enrolledIds = new Set((enrolled || []).map((s) => s.id));
  const candList = (candidates || [])
    .filter((u) => !enrolledIds.has(u.id))
    .filter((u) => { const q = search.trim().toLowerCase(); return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q); });

  const togglePick = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const confirmAdd = async () => {
    if (!picked.length) { setAdding(false); return; }
    setBusy(true);
    try {
      await classesApi.addStudents(cls.id, picked);
      setAdding(false);
      await loadEnrolled();
    } catch (e: any) {
      if (typeof window !== 'undefined') window.alert(e?.message || 'Không thêm được học viên.');
    }
    setBusy(false);
  };

  const removeOne = async (s) => {
    if (typeof window !== 'undefined' && !window.confirm(`Gỡ "${s.name}" khỏi lớp?`)) return;
    setBusy(true);
    try { await classesApi.removeStudent(cls.id, s.id); await loadEnrolled(); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không gỡ được học viên.'); }
    setBusy(false);
  };

  return (
    <ClassModal p={p} max={560} title={`Học viên · ${cls.name}`} onClose={onClose}>
      {!adding ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-lms-sub">{(enrolled || []).length} học viên đã ghi danh</span>
            <Btn p={p} size="sm" icon="plus" onClick={openAdd}>Thêm học viên</Btn>
          </div>
          {enrolled === null ? (
            <div className="py-6 text-center text-[12.5px] text-lms-faint">Đang tải…</div>
          ) : enrolled.length === 0 ? (
            <EmptyState p={p} icon="users" label="Chưa có học viên" sub="Bấm “Thêm học viên” để ghi danh." />
          ) : (
            <div className="flex max-h-[360px] flex-col gap-1.5 overflow-auto">
              {enrolled.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-lms-line bg-lms-surface px-3 py-2">
                  <Avatar name={s.name} p={p} size={32} color={p.accent} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-lms-ink">{s.name}</div>
                    <div className="truncate font-mono text-[11px] text-lms-faint">{s.email}</div>
                  </div>
                  <button title="Gỡ" disabled={busy} onClick={() => removeOne(s)}
                    className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-lms-danger/35 bg-lms-surface">
                    <Icon name="trash" size={14} stroke={p.danger} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field p={p} value={search} onChange={setSearch} icon="search" placeholder="Tìm học viên theo tên / email…" />
          {candidates === null ? (
            <div className="py-6 text-center text-[12.5px] text-lms-faint">Đang tải…</div>
          ) : candList.length === 0 ? (
            <EmptyState p={p} icon="users" label="Không có học viên phù hợp" sub="Tất cả học viên đã ghi danh hoặc không khớp tìm kiếm." />
          ) : (
            <div className="flex max-h-[320px] flex-col gap-1.5 overflow-auto">
              {candList.map((u) => {
                const on = picked.includes(u.id);
                return (
                  <div key={u.id} onClick={() => togglePick(u.id)}
                    className={`lms-row flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${on ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-[1.8px] ${on ? 'border-lms-accent bg-lms-accent' : 'border-lms-faint bg-transparent'}`}>
                      {on && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-lms-ink">{u.name}</div>
                      <div className="truncate font-mono text-[11px] text-lms-faint">{u.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-1 flex justify-end gap-2.5">
            <Btn p={p} variant="ghost" onClick={() => setAdding(false)}>Quay lại</Btn>
            <Btn p={p} icon="check" onClick={() => { if (!busy) confirmAdd(); }}>Ghi danh {picked.length ? `(${picked.length})` : ''}</Btn>
          </div>
        </div>
      )}
    </ClassModal>
  );
}
