'use client';
import React from 'react';
import { Icon, Tag, Btn, IconBtn, Field, Select, EmptyState } from '@/app/components/ui';
import { scheduleApi } from '@/app/lib/api';
import { lblClass, cardClass } from '@/app/helpers/shared';

// 0=CN … 6=Thứ 7 (khớp Date.getDay() ở backend).
const DOW = [
  { value: 1, label: 'Thứ Hai', short: 'T2' },
  { value: 2, label: 'Thứ Ba', short: 'T3' },
  { value: 3, label: 'Thứ Tư', short: 'T4' },
  { value: 4, label: 'Thứ Năm', short: 'T5' },
  { value: 5, label: 'Thứ Sáu', short: 'T6' },
  { value: 6, label: 'Thứ Bảy', short: 'T7' },
  { value: 0, label: 'Chủ Nhật', short: 'CN' },
];
const dowLabel = (n) => (DOW.find((d) => d.value === n) || { label: '—' }).label;

const EMPTY_FORM = { title: '', dayOfWeek: 1, time: '07:15', duration: '', room: '', classLabel: '' };

export function TSchedule({ p }) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [composing, setComposing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<any>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');

  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await scheduleApi.list();
      setItems(Array.isArray(r) ? r : (r?.records ?? []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditId(null); setForm(EMPTY_FORM); setErr(''); setComposing(true); };
  const openEdit = (s) => {
    setEditId(s._id);
    setForm({
      title: s.title || '', dayOfWeek: s.dayOfWeek ?? 1, time: s.time || '',
      duration: s.duration || '', room: s.room || '', classLabel: s.classLabel || '',
    });
    setErr(''); setComposing(true);
  };
  const close = () => { setComposing(false); setEditId(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.title.trim() || !form.time.trim()) { setErr('Cần nhập tiêu đề và giờ học.'); return; }
    setSaving(true); setErr('');
    const body = {
      title: form.title.trim(),
      dayOfWeek: Number(form.dayOfWeek),
      time: form.time.trim(),
      duration: form.duration.trim(),
      room: form.room.trim(),
      classLabel: form.classLabel.trim(),
    };
    try {
      if (editId) await scheduleApi.update(editId, body);
      else await scheduleApi.create(body);
      await load();
      close();
    } catch {
      setErr('Không thể lưu. Cần đăng nhập bằng tài khoản giáo viên/quản trị.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (typeof window !== 'undefined' && !window.confirm(`Xoá buổi “${s.title}” (${dowLabel(s.dayOfWeek)} · ${s.time})?`)) return;
    try { await scheduleApi.remove(s._id); await load(); }
    catch { if (typeof window !== 'undefined') window.alert('Không thể xoá. Cần quyền giáo viên/quản trị.'); }
  };

  // Nhóm theo thứ trong tuần, sắp theo giờ.
  const byDay = DOW.map((d) => ({
    ...d,
    rows: items.filter((s) => s.dayOfWeek === d.value).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
  }));

  const modal = composing && (
    <div onClick={close} className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(15,23,38,0.5)] p-5">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[560px] max-h-[88vh] overflow-y-auto rounded-2xl border border-lms-line bg-lms-surface p-6 shadow-[0_24px_70px_rgba(0,0,0,.22)]">
        <div className="mb-[18px] flex items-center justify-between">
          <h2 className="m-0 font-lms-heading text-xl font-bold text-lms-ink">{editId ? 'Sửa buổi dạy' : 'Thêm buổi dạy'}</h2>
          <button onClick={close} className="cursor-pointer border-0 bg-transparent text-lg leading-none text-lms-sub">✕</button>
        </div>
        <label className={lblClass()}>TIÊU ĐỀ BUỔI DẠY</label>
        <Field p={p} value={form.title} onChange={(v) => setF('title', v)} placeholder="vd: Tiếng Việt 5A1 — Tập đọc" className="mt-2 mb-4" />
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className={lblClass()}>THỨ</label>
            <Select p={p} value={String(form.dayOfWeek)} onChange={(v) => setF('dayOfWeek', Number(v))}
              options={DOW.map((d) => ({ value: String(d.value), label: d.label }))} className="mt-2" />
          </div>
          <div>
            <label className={lblClass()}>GIỜ BẮT ĐẦU</label>
            <Field p={p} value={form.time} onChange={(v) => setF('time', v)} placeholder="07:15" mono className="mt-2" />
          </div>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className={lblClass()}>THỜI LƯỢNG</label>
            <Field p={p} value={form.duration} onChange={(v) => setF('duration', v)} placeholder="40 phút" className="mt-2" />
          </div>
          <div>
            <label className={lblClass()}>PHÒNG</label>
            <Field p={p} value={form.room} onChange={(v) => setF('room', v)} placeholder="P.305" className="mt-2" />
          </div>
          <div>
            <label className={lblClass()}>LỚP</label>
            <Field p={p} value={form.classLabel} onChange={(v) => setF('classLabel', v)} placeholder="TV5A1" className="mt-2" />
          </div>
        </div>
        {err && <div className="mb-3 text-[12.5px] text-lms-danger">{err}</div>}
        <div className="mt-[18px] flex justify-end gap-2.5">
          <Btn p={p} variant="ghost" onClick={close}>Huỷ</Btn>
          <Btn p={p} icon="check" onClick={save}>{saving ? 'Đang lưu…' : (editId ? 'Cập nhật' : 'Lưu buổi dạy')}</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
        <div>
          <div className="font-mono text-[11px] tracking-[0.5px] text-lms-faint">{items.length} BUỔI / TUẦN</div>
          <p className="mt-1 mb-0 text-[13px] text-lms-sub">Lịch lặp lại theo thứ trong tuần — hiển thị ở widget “Lịch hôm nay”.</p>
        </div>
        <div className="flex-1" />
        <Btn p={p} icon="plus" onClick={openNew}>Thêm buổi dạy</Btn>
      </div>

      {loading ? (
        <div className={`${cardClass(20)} py-[60px] text-center text-[13px] text-lms-faint`}>Đang tải lịch dạy…</div>
      ) : items.length === 0 ? (
        <div className={`${cardClass(20)} mt-4`}>
          <EmptyState p={p} icon="calendar" label="Chưa có buổi dạy nào"
            sub="Thêm buổi dạy để xếp lịch theo thứ trong tuần."
            action={<Btn p={p} variant="soft" size="sm" icon="plus" onClick={openNew} className="mt-1">Thêm buổi dạy</Btn>} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay.filter((d) => d.rows.length > 0).map((d) => (
            <section key={d.value} className={cardClass(20)}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="m-0 font-lms-heading text-lg font-semibold text-lms-ink">{d.label}</h3>
                <Tag p={p} color={p.sub}>{d.rows.length} BUỔI</Tag>
              </div>
              <div className="flex flex-col">
                {d.rows.map((s, i) => (
                  <div key={s._id} className={`lms-row flex items-center gap-3.5 py-3 ${i ? 'border-t border-lms-line' : ''}`}>
                    <div className="w-[60px] shrink-0 text-right">
                      <div className="font-mono text-sm font-medium text-lms-ink">{s.time}</div>
                      {s.duration && <div className="mt-0.5 font-mono text-[10px] text-lms-faint">{s.duration}</div>}
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-lms-accent-soft">
                      <Icon name="calendar" size={17} stroke={p.accent} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-lms-ink">{s.title}</div>
                      <div className="mt-0.5 text-xs text-lms-sub">{[s.room, s.classLabel].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <IconBtn name="pen" p={p} size={34} title="Sửa" onClick={() => openEdit(s)} />
                      <IconBtn name="trash" p={p} size={34} title="Xoá" onClick={() => remove(s)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {modal}
    </div>
  );
}
