'use client';
import React from 'react';
import { Icon, Tag, Btn, IconBtn, Field, Select, Segmented, Progress, Ring } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { LMS, useLMS } from '@/app/store/store';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { filesApi, foldersApi, rubricsApi } from '@/app/lib/api';
import { FolderTree } from '@/app/components/FolderTree';
import { Pagination } from '@/app/components/Pagination';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapFile } from '@/app/lib/sync/load-library';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import RichEditor from '@/app/components/RichEditor';
import GoogleDrivePicker from '@/app/components/GoogleDrivePicker';

const mimeToType = (mt) => {
  mt = mt || '';
  if (mt.includes('pdf')) return 'pdf';
  if (mt.startsWith('image/')) return 'image';
  if (mt.startsWith('video/')) return 'video';
  if (mt.startsWith('audio/')) return 'audio';
  if (mt.includes('presentation') || mt.includes('powerpoint')) return 'slide';
  if (mt.includes('document') || mt.includes('word') || mt === 'text/plain') return 'doc';
  return 'link';
};


export const DOC_TYPE_META = {
  pdf: { icon: 'docs', label: 'PDF' }, slide: { icon: 'image', label: 'Slide' },
  audio: { icon: 'play', label: 'Audio' }, video: { icon: 'video', label: 'Video' },
  image: { icon: 'image', label: 'Ảnh' }, doc: { icon: 'docs', label: 'Tài liệu' },
  link: { icon: 'docs', label: 'Liên kết' },
};

export const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function TDocs({ p, t, auth }) {
  useLMS();
  const [selId, setSelId] = React.useState<string | null>(null);
  const [view, setView] = React.useState('grid');
  const tree: any[] = DB.DOC_FOLDER_TREE || [];
  const canManage = !!(auth && auth.isStaff);

  const paged = usePagedResource<any>({ fetcher: filesApi.list, mapper: mapFile });
  const { records: docs, loading, error } = paged;
  const kw = paged.keyword;
  const setKw = paged.setKeyword;
  const onSelectFolder = (id: string | null) => { setSelId(id); paged.setFilter('folderId', id); };
  const folderCounts = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of DB.DOCS) { if (d.folderId != null) m[String(d.folderId)] = (m[String(d.folderId)] || 0) + 1; }
    return m;
  }, [DB.DOCS]);
  const treeNodes = tree.map((n) => ({ ...n, count: folderCounts[n.id] || 0 }));
  const FTYPES = [
    { value: 'pdf', label: 'PDF' }, { value: 'doc', label: 'Tài liệu (Word/Docs)' },
    { value: 'image', label: 'Ảnh' }, { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Âm thanh' }, { value: 'slide', label: 'Slide' }, { value: 'link', label: 'Liên kết' },
  ];
  const folderOptions = [{ value: '', label: 'Không có thư mục' }, ...tree.map((n) => ({ value: n.id, label: n.name }))];
  const blankForm = () => ({ name: '', ftype: 'pdf', url: '', folderId: selId ?? '', desc: '' });
  const [composing, setComposing] = React.useState(false);
  const [form, setForm] = React.useState(blankForm);
  const [saving, setSaving] = React.useState(false);
  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const openCompose = () => { setForm(blankForm()); setComposing(true); };
  const closeCompose = () => { setComposing(false); setForm(blankForm()); };
  const saveDoc = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    const folderId = form.folderId || null;
    const tag = folderId ? (tree.find((n) => n.id === folderId)?.name) : undefined;
    try {
      await filesApi.create({ name: form.name.trim(), fileType: form.ftype, source: 'external', url: form.url.trim(), folderId, tags: tag ? [tag] : [], description: form.desc });
      await hydrateFor('docs');
      paged.reload();
      closeCompose();
    } catch {
      LMS && LMS.addDoc({ name: form.name.trim(), type: form.ftype, folder: tag ?? 'Tư liệu' });
      closeCompose();
    } finally { setSaving(false); }
  };

  const addRootFolder = async () => {
    const name = (typeof window !== 'undefined' ? window.prompt('Tên thư mục mới') : '')?.trim();
    if (!name) return;
    try { await foldersApi.create({ name, parentId: null }); await hydrateFor('docs'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không tạo được thư mục.'); }
  };
  const addChildFolder = async (parentId: string) => {
    const name = (typeof window !== 'undefined' ? window.prompt('Tên thư mục con') : '')?.trim();
    if (!name) return;
    try { await foldersApi.create({ name, parentId }); await hydrateFor('docs'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không tạo được thư mục.'); }
  };
  const renameFolder = async (node: any) => {
    const name = (typeof window !== 'undefined' ? window.prompt('Đổi tên thư mục', node.name) : '')?.trim();
    if (!name || name === node.name) return;
    try { await foldersApi.update(node.id, { name }); await hydrateFor('docs'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không đổi tên được thư mục.'); }
  };
  const deleteFolder = async (node: any) => {
    if (typeof window !== 'undefined' && !window.confirm(`Xoá thư mục “${node.name}”?`)) return;
    try {
      await foldersApi.remove(node.id);
      if (selId === node.id) onSelectFolder(null);
      await hydrateFor('docs');
      paged.reload();
    } catch (e: any) {
      if (typeof window !== 'undefined') window.alert(e?.message || 'Không xoá được thư mục.');
    }
  };

  const importDriveDocs = async (picked: any[]) => {
    const folderId: any = selId ?? null;
    const tag = folderId ? (tree.find((n) => n.id === folderId)?.name) : undefined;
    for (const d of picked) {
      const url = d.url || (d.id ? `https://drive.google.com/file/d/${d.id}/view` : '');
      if (!url) continue;
      try {
        await filesApi.create({ name: d.name || 'Tài liệu', fileType: mimeToType(d.mimeType), source: 'external', url, folderId, tags: tag ? [tag] : [], description: '' });
      } catch {}
    }
    await hydrateFor('docs');
    paged.reload();
  };
  const doDownload = (id: string) => { LMS && LMS.download(id); filesApi.download(id).catch(() => {}); };

  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuFor]);
  const openDoc = (d: any) => { if (d.url) window.open(d.url, '_blank', 'noopener'); };
  const copyLink = (d: any) => { try { navigator.clipboard?.writeText(d.url || ''); } catch {} };
  const deleteDoc = async (d: any) => {
    if (typeof window !== 'undefined' && !window.confirm(`Xoá tài liệu “${d.name}”?`)) return;
    try { await filesApi.remove(d.id); await hydrateFor('docs'); paged.reload(); }
    catch { DB.DOCS = DB.DOCS.filter((x) => x.id !== d.id); LMS && LMS.bump(); }
  };
  const DocMenu = ({ d, up }: { d: any; up?: boolean }) => (
    <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 z-30 w-[168px] overflow-hidden rounded-xl border border-lms-line bg-lms-surface py-1 shadow-[0_12px_36px_rgba(0,0,0,.18)] ${up ? 'bottom-[38px]' : 'top-[38px]'}`}>
      {[
        { ic: 'eye', lab: 'Mở tài liệu', fn: () => openDoc(d), disabled: !d.url },
        { ic: 'link', lab: 'Sao chép liên kết', fn: () => copyLink(d), disabled: !d.url },
        { ic: 'download', lab: 'Tải về', fn: () => doDownload(d.id) },
        { ic: 'trash', lab: 'Xoá', fn: () => deleteDoc(d), danger: true },
      ].map((m) => (
        <button key={m.lab} disabled={m.disabled} onClick={() => { setMenuFor(null); m.fn(); }}
          className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12.5px] ${m.disabled ? 'cursor-not-allowed text-lms-faint' : 'cursor-pointer ' + (m.danger ? 'text-lms-danger' : 'text-lms-ink')} hover:bg-lms-raise`}>
          <Icon name={m.ic} size={15} stroke={m.danger ? p.danger : p.sub} /> {m.lab}
        </button>
      ))}
    </div>
  );

  const addDocModal = composing && (
    <div onClick={closeCompose}
      className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(15,23,38,0.5)] p-5">
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[620px] max-h-[88vh] overflow-y-auto bg-lms-surface rounded-2xl border border-lms-line p-6 shadow-[0_24px_70px_rgba(0,0,0,.22)]">
        <div className="flex items-center justify-between mb-[18px]">
          <h2 className="m-0 font-lms-heading text-xl font-bold text-lms-ink">Thêm tài liệu</h2>
          <button onClick={closeCompose} className="cursor-pointer border-0 bg-transparent text-lg leading-none text-lms-sub">✕</button>
        </div>
        <label className={lblClass()}>TÊN TÀI LIỆU</label>
        <Field p={p} value={form.name} onChange={(v) => setF('name', v)} placeholder="vd: Đề bài — Tả con vật nuôi em yêu thích" className="mt-2 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className={lblClass()}>LOẠI</label><Select p={p} value={form.ftype} onChange={(v) => setF('ftype', v)} options={FTYPES} className="mt-2" /></div>
          <div><label className={lblClass()}>THƯ MỤC</label><Select p={p} value={form.folderId} onChange={(v) => setF('folderId', v)} options={folderOptions} className="mt-2" /></div>
        </div>
        <label className={lblClass()}>LIÊN KẾT (URL)</label>
        <Field p={p} value={form.url} onChange={(v) => setF('url', v)} placeholder="https://drive.google.com/file/d/.../view" className="mt-2 mb-4" />
        <label className={lblClass()}>MÔ TẢ (soạn bằng trình soạn thảo)</label>
        <div className="mt-2"><RichEditor value={form.desc} onChange={(v) => setF('desc', v)} placeholder="Mô tả ngắn về tài liệu: dùng để làm gì, phù hợp lớp nào…" /></div>
        <div className="flex justify-end gap-2.5 mt-[18px]">
          <Btn p={p} variant="ghost" onClick={closeCompose}>Huỷ</Btn>
          <Btn p={p} icon="check" onClick={saveDoc}>{saving ? 'Đang lưu…' : 'Lưu tài liệu'}</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-[1480px] grid-cols-[210px_1fr] gap-[26px] px-[30px] pt-6 pb-10">
      <aside>
        <Btn p={p} icon="plus" full onClick={openCompose}>Thêm tài liệu</Btn>
        <div className="mt-[18px] px-1.5 pb-2 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">THƯ MỤC</div>
        <FolderTree
          nodes={treeNodes}
          selectedId={selId}
          onSelect={onSelectFolder}
          p={p}
          allLabel="Tất cả"
          allCount={paged.total}
          {...(canManage ? {
            onAddRoot: addRootFolder,
            onAddChild: addChildFolder,
            onRename: renameFolder,
            onDelete: deleteFolder,
          } : {})}
        />
      </aside>

      <div>
        <div className="mb-[18px] flex items-center gap-2.5">
          <Field p={p} icon="search" value={kw} onChange={setKw} placeholder="Tìm tài liệu…" className="w-[260px]" />
          <GoogleDrivePicker p={p} onPicked={importDriveDocs} label="Google Drive" />
          <div className="flex-1" />
          <Segmented p={p} value={view} onChange={setView} options={[{ value: 'grid', icon: 'grid' }, { value: 'list', icon: 'list' }]} />
        </div>

        {loading ? (
          <div className="py-16 text-center text-[13px] text-lms-faint">Đang tải…</div>
        ) : docs.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-lms-faint">{error ? 'Không tải được dữ liệu' : 'Không có kết quả'}</div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {docs.map((d) => {
              const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
              return (
                <div key={d.id} className={`lms-card ${cardClass(20).replace('p-5', 'p-0')} cursor-pointer overflow-hidden`}>
                  <div className="relative flex h-24 items-center justify-center overflow-hidden bg-lms-accent-soft">
                    <Icon name={m.icon} size={32} stroke={p.accent} sw={1.4} />
                    {d.thumb && <img src={d.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.classList.add('hidden'); }} className="absolute inset-0 h-full w-full object-cover" />}
                    <span className={`absolute top-2.5 left-2.5 z-2 rounded-[7px] ${d.thumb ? 'bg-white/92 shadow-[0_1px_3px_rgba(0,0,0,.12)] backdrop-blur-sm' : 'bg-transparent'}`}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                  </div>
                  <div className="p-3.5">
                    <div className="line-clamp-2 min-h-[34px] text-[13px] font-semibold wrap-break-word leading-snug text-lms-ink">{d.name}</div>
                    {d.desc && <div className="mt-[5px] line-clamp-2 text-[11px] wrap-break-word leading-snug text-lms-sub">{stripHtml(d.desc).slice(0, 100)}</div>}
                    <div className="mt-2.5 flex items-center gap-3 font-mono text-[11px] text-lms-faint">
                      <span>👁 {d.views ?? 0}</span><span>↓ {d.downloads}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Btn p={p} variant="soft" size="sm" icon="download" full onClick={() => doDownload(d.id)}>Tải về</Btn>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <IconBtn name="more" p={p} size={34} onClick={() => setMenuFor(menuFor === d.id ? null : d.id)} />
                        {menuFor === d.id && <DocMenu d={d} up />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cardClass(20).replace('p-5', 'p-0')}>
            {docs.map((d, i) => {
              const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
              return (
                <div key={d.id} className={`lms-row flex cursor-pointer items-center gap-3.5 px-[18px] py-[13px] ${i ? 'border-t border-lms-line-soft' : ''}`}>
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-lms-accent-soft">
                    <Icon name={m.icon} size={18} stroke={p.accent} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-lms-ink">{d.name}</div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-lms-faint">{m.label} · {d.folder}</div>
                  </div>
                  <div className="w-[110px] text-xs text-lms-sub">{d.updated}</div>
                  <div className="w-[110px] whitespace-nowrap font-mono text-xs text-lms-faint">👁 {d.views ?? 0} · ↓ {d.downloads}</div>
                  <Btn p={p} variant="soft" size="sm" icon="download" onClick={() => doDownload(d.id)}>Tải</Btn>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <IconBtn name="more" p={p} size={34} onClick={() => setMenuFor(menuFor === d.id ? null : d.id)} />
                    {menuFor === d.id && <DocMenu d={d} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
      </div>
      {addDocModal}
    </div>
  );
}

export function RubricMatrix({ rubric, p, mode = 'view', selected, onSelect }: any) {
  const scale = rubric.scale;
  return (
    <div className="lms-scrollx overflow-hidden rounded-xl border border-lms-line">
      <div className="grid border-b border-lms-line bg-lms-raise" style={{ gridTemplateColumns: `1.4fr repeat(${scale.length}, 1fr)` }}>
        <div className="px-3.5 py-[11px] font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">TIÊU CHÍ</div>
        {scale.map((s, i) => (
          <div key={i} className="border-l border-lms-line px-3 py-[11px] text-center">
            <div className="text-[12.5px] font-semibold text-lms-ink">{s.label}</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-lms-faint">{s.pct}%</div>
          </div>
        ))}
      </div>
      {rubric.criteria.map((c, ci) => (
        <div key={ci} className={`grid ${ci ? 'border-t border-lms-line-soft' : ''}`} style={{ gridTemplateColumns: `1.4fr repeat(${scale.length}, 1fr)` }}>
          <div className="px-3.5 py-[13px]">
            <div className="text-[13.5px] font-semibold text-lms-ink">{c.name}</div>
            {c.desc && <div className="mt-[3px] text-[11.5px] leading-snug text-lms-faint">{c.desc}</div>}
            <Tag p={p} color={p.accent} className="mt-2">{c.weight}%</Tag>
          </div>
          {scale.map((s, si) => {
            const on = selected && selected[ci] === si;
            return (
              <div key={si} onClick={() => mode === 'grade' && onSelect && onSelect(ci, si)}
                className={`flex flex-col items-center justify-center gap-1.5 border-l border-lms-line-soft px-2.5 py-[13px] transition-colors duration-120 ${mode === 'grade' ? 'cursor-pointer' : 'cursor-default'} ${on ? 'bg-lms-accent-soft' : 'bg-transparent'}`}>
                {mode === 'grade' && (
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.8px] ${on ? 'border-lms-accent bg-lms-accent' : 'border-lms-faint bg-transparent'}`}>
                    {on && <Icon name="check" size={11} stroke="#fff" sw={2.5} />}</span>
                )}
                <span className={`font-lms-heading text-base font-semibold ${on ? 'text-lms-accent' : 'text-lms-sub'}`}>
                  {((c.weight * s.pct) / 1000).toFixed(1)}</span>
                {mode === 'edit' && <span className="text-center text-[10.5px] text-lms-faint">điểm</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function TRubrics({ p, t, setRoute, go }) {
  const [kw, setKw] = React.useState('');
  const k = kw.trim().toLowerCase();
  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex items-center gap-2.5">
        <Field p={p} icon="search" value={kw} onChange={setKw} placeholder="Tìm rubric…" className="w-[260px]" />
        <div className="flex-1" />
        <Btn p={p} icon="plus" onClick={() => setRoute('rubric-edit')}>Tạo rubric</Btn>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-5">
        {DB.RUBRICS.filter((r) => !k || (r.name || '').toLowerCase().includes(k)).map((r) => (
          <div key={r.id} onClick={() => go('rubric-edit', { rubric: r.id })} className={`lms-card ${cardClass(24)} cursor-pointer`}>
            <div className="mb-3.5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-lms-accent-soft">
                  <Icon name="rubric" size={20} stroke={p.accent} /></div>
                <div>
                  <h3 className="m-0 font-lms-heading text-lg font-semibold leading-tight text-lms-ink">{r.name}</h3>
                  <div className="mt-[3px] font-mono text-[11.5px] text-lms-faint">{r.criteria.length} tiêu chí · {r.scale.length} mức · dùng {r.used} lần</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[7px]">
              {r.criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex-1 text-[12.5px] text-lms-sub">{c.name}</div>
                  <div className="w-[70px]"><Progress p={p} value={c.weight} height={5} /></div>
                  <span className="w-8 text-right font-mono text-[11px] text-lms-faint">{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TRubricEdit({ p, t, ctx, setRoute }) {
  const EMPTY_RUBRIC = { id: '', name: 'Rubric mới', used: 0, levels: 0, criteria: [], scale: [] };
  const base = (ctx.rubric ? DB.RUBRICS.find((r) => r.id === ctx.rubric) : DB.RUBRICS[0]) || EMPTY_RUBRIC;
  const [rubric, setRubric] = React.useState(() => JSON.parse(JSON.stringify(base)));
  const totalW = (rubric.criteria || []).reduce((s, c) => s + (c.weight || 0), 0);

  const patchCrit = (i, k, v) => { const n = { ...rubric, criteria: rubric.criteria.map((c, j) => j === i ? { ...c, [k]: v } : c) }; setRubric(n); };
  const addCrit = () => setRubric({ ...rubric, criteria: [...rubric.criteria, { name: 'Tiêu chí mới', weight: 0, desc: '' }] });
  const delCrit = (i) => setRubric({ ...rubric, criteria: rubric.criteria.filter((_, j) => j !== i) });

  const patchLevel = (i, k, v) => setRubric((r) => ({ ...r, scale: (r.scale || []).map((s, j) => j === i ? { ...s, [k]: v } : s) }));
  const addLevel = () => setRubric((r) => { const sc = r.scale || []; const lastPct = sc.length ? (sc[sc.length - 1].pct ?? 0) : 0; return { ...r, scale: [...sc, { label: `Mức ${sc.length + 1}`, pct: lastPct }] }; });
  const delLevel = (i) => setRubric((r) => ({ ...r, scale: (r.scale || []).filter((_, j) => j !== i) }));

  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
      <div onClick={() => setRoute('rubrics')} className="lms-link mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Rubrics
      </div>

      <div className="mb-[22px] flex items-center gap-4">
        <input value={rubric.name} onChange={(e) => setRubric({ ...rubric, name: e.target.value })}
          className="flex-1 border-0 bg-transparent font-lms-heading text-[28px] font-semibold tracking-[-0.4px] text-lms-ink outline-none" />
        <Btn p={p} variant="ghost" onClick={() => setRoute('rubrics')}>Huỷ</Btn>
        <Btn p={p} icon="check" onClick={async () => {
          const body = {
            name: rubric.name,
            levels: (rubric.scale || []).map((s: any, i: number) => ({ name: s.label, percentage: s.pct ?? 0, order: i })),
            criterions: (rubric.criteria || []).map((c: any, i: number) => ({ name: c.name, note: c.desc || '', weight: c.weight ?? 0, order: i })),
          };
          try {
            if (ctx.rubric) await rubricsApi.update(rubric.id, body);
            else await rubricsApi.create(body);
            await hydrateFor('rubrics');
          } catch {
            LMS && LMS.saveRubric(rubric);
          } finally {
            setRoute('rubrics');
          }
        }}>Lưu rubric</Btn>
      </div>

      <div className="mb-[22px] flex gap-3">
        <div className={`${cardClass(16)} flex flex-1 items-center gap-3`}>
          <Ring value={totalW} size={48} thickness={6} p={p} color={totalW === 100 ? p.ok : p.warn} />
          <div><div className="text-[13px] font-semibold text-lms-ink">Tổng trọng số {totalW}%</div>
            <div className={`text-[11.5px] ${totalW === 100 ? 'text-lms-ok' : 'text-lms-warn'}`}>{totalW === 100 ? 'Hợp lệ' : 'Nên bằng 100%'}</div></div>
        </div>
        <div className={`${cardClass(16)} flex flex-1 items-center gap-3`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lms-accent-soft">
            <Icon name="rubric" size={22} stroke={p.accent} /></div>
          <div><div className="text-[13px] font-semibold text-lms-ink">{rubric.criteria.length} tiêu chí · {rubric.scale.length} mức</div>
            <div className="text-[11.5px] text-lms-faint">Thang điểm 10</div></div>
        </div>
      </div>

      <section className={`${cardClass(24)} mb-[22px]`}>
        <label className={lblClass()}>TIÊU CHÍ ĐÁNH GIÁ</label>
        <div className="mt-3 flex flex-col gap-2.5">
          {rubric.criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-lms-line bg-lms-raise p-3">
              <Icon name="drag" size={16} stroke={p.faint} />
              <div className="flex-1">
                <input value={c.name} onChange={(e) => patchCrit(i, 'name', e.target.value)}
                  className="w-full border-0 bg-transparent font-sans text-sm font-semibold text-lms-ink outline-none" />
                <input value={c.desc} onChange={(e) => patchCrit(i, 'desc', e.target.value)} placeholder="Mô tả tiêu chí (tuỳ chọn)…"
                  className="mt-[3px] w-full border-0 bg-transparent font-sans text-xs text-lms-sub outline-none" />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-lms-line bg-lms-surface px-2.5 py-1.5">
                <input type="number" value={c.weight} onChange={(e) => patchCrit(i, 'weight', Number(e.target.value))}
                  className="w-10 border-0 bg-transparent text-right font-mono text-sm text-lms-ink outline-none" />
                <span className="font-mono text-[13px] text-lms-faint">%</span>
              </div>
              <IconBtn name="trash" p={p} size={36} onClick={() => delCrit(i)} />
            </div>
          ))}
        </div>
        <Btn p={p} variant="quiet" size="sm" icon="plus" className="mt-3 pl-0" onClick={addCrit}>Thêm tiêu chí</Btn>
      </section>

      <section className={`${cardClass(24)} mb-[22px]`}>
        <label className={lblClass()}>MỨC ĐÁNH GIÁ (cột ma trận)</label>
        <div className="mt-3 flex flex-col gap-2.5">
          {(rubric.scale || []).map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-lms-line bg-lms-raise p-3">
              <Icon name="drag" size={16} stroke={p.faint} />
              <input value={s.label} onChange={(e) => patchLevel(i, 'label', e.target.value)} placeholder="Tên mức (vd: Tốt)…"
                className="flex-1 border-0 bg-transparent font-sans text-sm font-semibold text-lms-ink outline-none" />
              <div className="flex items-center gap-1.5 rounded-xl border border-lms-line bg-lms-surface px-2.5 py-1.5">
                <input type="number" value={s.pct ?? 0} onChange={(e) => patchLevel(i, 'pct', Number(e.target.value))}
                  className="w-12 border-0 bg-transparent text-right font-mono text-sm text-lms-ink outline-none" />
                <span className="font-mono text-[13px] text-lms-faint">%</span>
              </div>
              <IconBtn name="trash" p={p} size={36} onClick={() => delLevel(i)} />
            </div>
          ))}
          {!(rubric.scale || []).length && (
            <div className="rounded-xl border border-dashed border-lms-line bg-lms-raise px-3.5 py-4 text-center text-[12.5px] text-lms-faint">
              Chưa có mức đánh giá nào. Thêm ít nhất một mức để tạo cột cho ma trận điểm.
            </div>
          )}
        </div>
        <Btn p={p} variant="quiet" size="sm" icon="plus" className="mt-3 pl-0" onClick={addLevel}>Thêm mức</Btn>
      </section>

      <section className={cardClass(24)}>
        <div className="mb-3.5 flex items-center justify-between">
          <label className={lblClass()}>MA TRẬN ĐIỂM (xem trước)</label>
          <Tag p={p} color={p.sub}>{rubric.scale.length} mức đánh giá</Tag>
        </div>
        <RubricMatrix rubric={rubric} p={p} mode="edit" />
      </section>
    </div>
  );
}
