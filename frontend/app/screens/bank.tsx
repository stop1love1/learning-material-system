'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon, Tag, Pill, Btn, IconBtn, Field, Select } from '@/app/components/ui';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/store/store';
import { LMS } from '@/app/store/store';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { questionsApi, topicsApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { FolderTree, type TreeNode } from '@/app/components/FolderTree';
import { Pagination } from '@/app/components/Pagination';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapQuestion } from '@/app/lib/sync/load-questions';

// Map a /questions/:id detail payload → the shape QuestionView expects.
function qDetailToView(type: string, d: any): { options: any[]; answer: any[]; pairs: any[] } {
  const out = { options: [] as any[], answer: [] as any[], pairs: [] as any[] };
  if (!d) return out;
  if (type === 'single') { out.options = d.options || []; out.answer = d.correctOptionIndex != null ? [d.correctOptionIndex] : []; }
  else if (type === 'multi') { out.options = d.options || []; out.answer = d.correctOptionIndices || []; }
  else if (type === 'truefalse') { out.answer = [d.isCorrect ? 0 : 1]; }
  else if (type === 'fill') { out.answer = d.answers || []; }
  else if (type === 'match') { out.pairs = (d.pairs || []).map((pp: any) => [pp.left || '', pp.right || '']); }
  return out;
}

let pendingTopicId: string | null = null;

export function typeMeta(id) { return DB.QTYPES.find((x) => x.id === id) || DB.QTYPES[0]; }
export function levelMeta(id) { return DB.LEVELS.find((x) => x.id === id) || DB.LEVELS[0]; }

function optClass(selected, correct, mode) {
  const previewCorrect = correct && mode === 'preview';
  return `mb-2 flex items-center gap-3 rounded-xl border px-3.5 py-3 ${mode === 'do' ? 'cursor-pointer' : 'cursor-default'} ${
    previewCorrect ? 'border-lms-ok bg-lms-ok/8' : selected ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'
  }`;
}

export function FillInput({ p, value, onChange }) {
  const [focus, setFocus] = React.useState(false);
  const filled = (value || '').trim().length > 0;
  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <input value={value || ''} onChange={(e) => onChange({ text: e.target.value })}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder="Điền đáp án…"
        className={`h-12 min-w-[240px] rounded-xl border-[1.5px] bg-lms-surface px-[18px] font-mono text-base text-lms-ink outline-none transition-[border-color,box-shadow] duration-200 ${
          focus ? 'border-lms-accent shadow-[0_0_0_4px_var(--lms-accent-soft)]' : filled ? 'border-lms-accent/50' : 'border-lms-line'
        }`} />
      <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-200 ${filled ? 'text-lms-ok' : 'text-lms-faint'}`}>
        <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all duration-200 ${
          filled ? 'scale-100 border-0 bg-lms-ok' : 'scale-90 border-[1.5px] border-lms-line bg-transparent'
        }`}>
          {filled && <Icon name="check" size={11} stroke="#fff" sw={2.6} />}
        </span>
        {filled ? 'Đã điền' : 'Chưa điền'}
      </span>
    </div>
  );
}

export function MatchBoard({ p, q, answer, onAnswer }) {
  const map = (answer && answer.map) || {};
  const rights = q.pairs.map((pr) => pr[1]);
  const used = Object.values(map);
  const pool = rights.filter((r) => !used.includes(r));
  const [pick, setPick] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const set = (li, val) => { const m = { ...map }; Object.keys(m).forEach((k) => { if (m[k] === val) delete m[k]; }); m[li] = val; onAnswer({ map: m }); setPick(null); };
  const clear = (li) => { const m = { ...map }; delete m[li]; onAnswer({ map: m }); };
  const chip = (val: any, opts: any = {}) => {
    const picked = pick === val;
    return (
      <div draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', val); }} onClick={() => setPick(pick === val ? null : val)}
        className={`inline-flex cursor-grab items-center gap-[7px] rounded-[10px] px-[13px] py-2 text-sm font-semibold transition-[transform,background] duration-150 ${
          picked ? 'border border-lms-accent bg-lms-accent text-white' : 'border border-transparent bg-lms-accent-soft text-lms-accent'
        } ${opts.className || ''}`}>
        <Icon name="drag" size={14} stroke={picked ? '#fff' : p.accent} /> {val}
        {opts.onX && <span onClick={(e) => { e.stopPropagation(); opts.onX(); }} className="ml-0.5 inline-flex"><Icon name="x" size={13} stroke={picked ? '#fff' : p.accent} /></span>}
      </div>
    );
  };
  return (
    <div>
      {pool.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-2 rounded-xl bg-lms-sink p-3">
          <span className="mr-1 self-center text-xs text-lms-faint">Kéo (hoặc chạm) đáp án vào ô:</span>
          {pool.map((val) => <React.Fragment key={val}>{chip(val)}</React.Fragment>)}
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {q.pairs.map((pr, i) => {
          const val = map[i];
          const isOver = over === i;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2.5 rounded-[10px] border border-lms-line bg-lms-surface px-3.5 py-3 text-[15px] text-lms-ink">{pr[0]}</div>
              <Icon name="arrowRight" size={16} stroke={p.faint} />
              <div onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); const v = e.dataTransfer.getData('text/plain'); if (v) set(i, v); setOver(null); }}
                onClick={() => { if (pick) set(i, pick); else if (val) clear(i); }}
                className={`flex min-h-[46px] flex-1 items-center rounded-[10px] px-3 py-[7px] transition-all duration-150 ${
                  isOver ? 'border-[1.5px] border-dashed border-lms-accent bg-lms-accent-soft' : val ? 'border-[1.5px] border-dashed border-transparent bg-transparent' : 'border-[1.5px] border-dashed border-lms-line bg-lms-raise'
                } ${pick || val ? 'cursor-pointer' : 'cursor-default'}`}>
                {val ? chip(val, { onX: () => clear(i), className: 'cursor-pointer' })
                  : <span className={`text-[13px] ${isOver ? 'text-lms-accent' : 'text-lms-faint'}`}>{isOver ? 'Thả vào đây' : 'Thả đáp án…'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuestionView({ q, p, mode = 'preview', answer, onAnswer }: any) {
  const a = answer || {};
  const isCorrect = (i) => (q.answer || []).includes(i);

  if (q.type === 'single' || q.type === 'multi') {
    const sel = a.choices || [];
    const toggle = (i) => {
      if (mode !== 'do') return;
      if (q.type === 'single') onAnswer({ choices: [i] });
      else onAnswer({ choices: sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i] });
    };
    return (
      <div>
        {q.options.map((o, i) => {
          const selected = sel.includes(i), correct = isCorrect(i);
          const box = q.type === 'single' ? 'rounded-full' : 'rounded-md';
          const previewCorrect = correct && mode === 'preview';
          return (
            <div key={i} onClick={() => toggle(i)} className={optClass(selected, correct, mode)}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center border-[1.8px] ${box} ${
                previewCorrect ? 'border-lms-ok bg-lms-ok' : selected ? 'border-lms-accent bg-lms-accent' : 'border-lms-faint bg-transparent'
              }`}>
                {(selected || previewCorrect) && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}
              </span>
              <span className="flex-1 text-sm text-lms-ink">{o}</span>
              {correct && mode === 'preview' && <Tag p={p} color={p.ok}>Đáp án</Tag>}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === 'truefalse') {
    const sel = a.choices != null ? a.choices[0] : null;
    return (
      <div className="flex gap-3">
        {['Đúng', 'Sai'].map((lab, i) => {
          const selected = sel === i, correct = isCorrect(i);
          return (
            <div key={i} onClick={() => mode === 'do' && onAnswer({ choices: [i] })}
              className={`${optClass(selected, correct, mode)} mb-0 flex-1 justify-center p-4`}>
              <Icon name={i === 0 ? 'check' : 'x'} size={18} stroke={correct && mode === 'preview' ? p.ok : selected ? p.accent : p.faint} sw={2.2} />
              <span className="text-[15px] font-semibold text-lms-ink">{lab}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === 'fill') {
    return (
      <div>
        {mode === 'do' ? (
          <FillInput p={p} value={a.text} onChange={onAnswer} />
        ) : (
          <div className="inline-flex items-center gap-2.5 rounded-[10px] border border-dashed border-lms-ok bg-lms-ok/6 px-4 py-2.5">
            <span className="font-mono text-[15px] text-lms-ink">{(q.answer || ['—'])[0]}</span>
            <Tag p={p} color={p.ok}>Đáp án</Tag>
          </div>
        )}
      </div>
    );
  }

  if (q.type === 'essay') {
    return mode === 'do' ? (
      <textarea value={a.text || ''} onChange={(e) => onAnswer({ text: e.target.value })} placeholder="Viết câu trả lời của bạn…"
        className="box-border min-h-40 w-full resize-y rounded-xl border border-lms-line bg-lms-surface p-3.5 font-sans text-sm leading-relaxed text-lms-ink outline-none" />
    ) : (
      <div className="rounded-xl border border-dashed border-lms-line bg-lms-raise p-3.5 text-[13px] text-lms-sub italic">
        Câu tự luận — chấm bằng rubric hoặc cho điểm thủ công.
      </div>
    );
  }

  if (q.type === 'match') {
    if (mode === 'do') return <MatchBoard p={p} q={q} answer={a} onAnswer={onAnswer} />;
    return (
      <div className="flex flex-col gap-2.5">
        {q.pairs.map((pr, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2.5 rounded-[10px] border border-lms-line bg-lms-surface px-3.5 py-[11px]">
              <Icon name="drag" size={15} stroke={p.faint} />
              <span className="text-[15px] text-lms-ink">{pr[0]}</span>
            </div>
            <Icon name="arrowRight" size={16} stroke={p.ok} />
            <div className="flex-1 rounded-[10px] border border-lms-ok bg-lms-ok/7 px-3.5 py-[11px]">
              <span className="font-mono text-sm text-lms-ink">{pr[1]}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function TBank({ p, t, setRoute, go }) {
  const [type, setType] = React.useState('all');
  const [sel, setSel] = React.useState<string | undefined>(undefined);
  const [showFilter, setShowFilter] = React.useState(false);
  const [level, setLevel] = React.useState('all');
  const [selTopic, setSelTopic] = React.useState<string | null>(null);

  // Server-side paged (type/level/topic/keyword filters via API) + antd Pagination.
  const paged = usePagedResource<any>({ fetcher: questionsApi.list, mapper: mapQuestion, pageSize: 10 });
  const list = paged.records;
  const pickType = (v: string) => { setType(v); paged.setFilter('type', v === 'all' ? '' : v); };
  const pickLevel = (v: string) => { setLevel(v); paged.setFilter('level', v === 'all' ? '' : v); };
  const pickTopic = (id: string | null) => { setSelTopic(id); paged.setFilter('topicId', id || ''); };

  const addRootTopic = async () => {
    const title = (typeof window !== 'undefined' && window.prompt('Tên chủ đề mới:'))?.trim();
    if (!title) return;
    try { await topicsApi.create({ title, parentId: null }); await hydrateFor('bank'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không tạo được chủ đề.'); }
  };
  const addChildTopic = async (parentId: string) => {
    const title = (typeof window !== 'undefined' && window.prompt('Tên chủ đề con:'))?.trim();
    if (!title) return;
    try { await topicsApi.create({ title, parentId }); await hydrateFor('bank'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không tạo được chủ đề.'); }
  };
  const renameTopic = async (node: TreeNode) => {
    const title = (typeof window !== 'undefined' && window.prompt('Đổi tên chủ đề:', node.name))?.trim();
    if (!title || title === node.name) return;
    try { await topicsApi.update(node.id, { title }); await hydrateFor('bank'); }
    catch (e: any) { if (typeof window !== 'undefined') window.alert(e?.message || 'Không đổi tên được.'); }
  };
  const deleteTopic = async (node: TreeNode) => {
    if (typeof window !== 'undefined' && !window.confirm(`Xoá chủ đề “${node.name}”?`)) return;
    try {
      await topicsApi.remove(node.id);
      if (selTopic === node.id) setSelTopic(null);
      await hydrateFor('bank');
    } catch (e: any) {
      if (typeof window !== 'undefined') window.alert(e?.message || 'Không xoá được chủ đề.');
    }
  };
  const composeWithTopic = () => { pendingTopicId = selTopic; setRoute('bank-edit'); };
  const q = list.find((x) => x.id === sel) || list[0];

  // The list mapper omits per-type detail (no N+1); fetch it lazily for the
  // previewed question so QuestionView shows options/answer/pairs.
  const [detailMap, setDetailMap] = React.useState<Record<string, any>>({});
  React.useEffect(() => {
    const id = q?.id;
    if (!id || detailMap[id]) return;
    let alive = true;
    questionsApi.get(id).then((r: any) => {
      if (!alive || !r?.detail) return;
      setDetailMap((m) => ({ ...m, [id]: qDetailToView(q.type, r.detail) }));
    }).catch(() => {});
    return () => { alive = false; };
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const qFull = q ? { ...q, ...(detailMap[q.id] || {}) } : q;

  const duplicate = async (src) => {
    if (!src) return;
    const detail: Record<string, any> = {};
    if (src.type === 'single') detail.options = src.options || [];
    else if (src.type === 'multi') detail.options = src.options || [];
    else if (src.type === 'fill') detail.answers = src.answer || [];
    else if (src.type === 'match') detail.pairs = (src.pairs || []).map((pr) => ({ left: pr[0], right: pr[1] }));
    if (src.type === 'single') detail.correctOptionIndex = (src.answer || [0])[0] ?? 0;
    else if (src.type === 'multi') detail.correctOptionIndices = src.answer || [];
    else if (src.type === 'truefalse') detail.isCorrect = (src.answer || [])[0] === 0;
    else if (src.type === 'essay') detail.gradingType = src.detail?.gradingType === 'rubric' ? 'rubric' : 'manual';
    try {
      await questionsApi.create({ type: src.type, level: src.level, content: (src.stem || '') + ' (bản sao)', detail });
      await hydrateFor('bank');
    } catch {
      LMS && LMS.addQuestion({ type: src.type, level: src.level, stem: (src.stem || '') + ' (bản sao)',
        options: src.options, answer: src.answer, pairs: src.pairs, topic: src.topic });
    }
  };
  const treeSidebar = (
    <aside>
      <Btn p={p} icon="plus" full onClick={composeWithTopic}>Soạn câu hỏi</Btn>
      <div className="mt-[18px] px-1.5 pb-2 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">CHỦ ĐỀ</div>
      <FolderTree
        nodes={(DB.TOPIC_TREE || []) as TreeNode[]}
        selectedId={selTopic}
        onSelect={pickTopic}
        p={p}
        allLabel="Tất cả chủ đề"
        allCount={DB.QUESTIONS.length}
        onAddRoot={addRootTopic}
        onAddChild={addChildTopic}
        onRename={renameTopic}
        onDelete={deleteTopic}
      />
    </aside>
  );

  if (!q) {
    return (
      <div className="mx-auto grid max-w-[1480px] grid-cols-[230px_1fr] items-start gap-[26px] px-[30px] pt-6 pb-10">
        {treeSidebar}
        <div className="px-5 py-[60px] text-center text-lms-ink/60">
          {selTopic === null
            ? 'Chưa có câu hỏi nào. Bấm “Soạn câu hỏi” để thêm câu hỏi đầu tiên.'
            : 'Chủ đề này chưa có câu hỏi nào.'}
        </div>
      </div>
    );
  }
  const tm = typeMeta(q.type), lm = levelMeta(q.level);
  return (
    <div className="mx-auto grid max-w-[1480px] grid-cols-[230px_1fr] items-start gap-[26px] px-[30px] pt-6 pb-10">
      {treeSidebar}
      <div>
      <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
        <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm câu hỏi, chủ đề…" className="w-[280px]" />
        <div className="flex-1" />
        <Btn p={p} variant={showFilter || level !== 'all' ? 'soft' : 'ghost'} size="md" icon="filter" onClick={() => setShowFilter((s) => !s)}>Bộ lọc</Btn>
        <Btn p={p} icon="plus" onClick={composeWithTopic}>Soạn câu hỏi</Btn>
      </div>

      {showFilter && (
        <div className="mb-[18px] flex flex-wrap items-center gap-2.5 rounded-xl border border-lms-line bg-lms-raise px-4 py-3">
          <span className="font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">ĐỘ KHÓ</span>
          <Pill p={p} active={level === 'all'} onClick={() => pickLevel('all')}>Tất cả</Pill>
          {DB.LEVELS.map((l) => (
            <Pill key={l.id} p={p} active={level === l.id} onClick={() => pickLevel(l.id)}>{l.label}</Pill>
          ))}
          {level !== 'all' && (
            <button onClick={() => pickLevel('all')} className="ml-auto cursor-pointer border-0 bg-transparent font-mono text-[11px] text-lms-accent">Xoá lọc</button>
          )}
        </div>
      )}

      <div className="mb-[18px] flex flex-wrap gap-2">
        <Pill p={p} active={type === 'all'} onClick={() => pickType('all')}>Tất cả · {DB.QUESTIONS.length}</Pill>
        {DB.QTYPES.map((qt) => {
          const n = DB.QUESTIONS.filter((x) => x.type === qt.id).length;
          return <Pill key={qt.id} p={p} icon={qt.icon} active={type === qt.id} onClick={() => pickType(qt.id)}>{qt.short} · {n}</Pill>;
        })}
      </div>

      <div className="grid grid-cols-[1.25fr_1fr] items-start gap-[22px]">
        <div>
        <div className="flex flex-col gap-3">
          {list.map((item) => {
            const im = typeMeta(item.type), il = levelMeta(item.level), on = item.id === sel;
            return (
              <div key={item.id} onClick={() => setSel(item.id)} className={`lms-card ${cardClass(16)} cursor-pointer ${on ? 'border-lms-accent shadow-[0_0_0_1px_var(--lms-accent)]' : ''}`}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-xl bg-lms-accent-soft">
                    <Icon name={im.icon} size={15} stroke={p.accent} /></span>
                  <Tag p={p} color={p.sub}>{im.short}</Tag>
                  <Tag p={p} color={il.color}>{il.label}</Tag>
                  <span className="ml-auto font-mono text-[10.5px] text-lms-faint">{item.topic}</span>
                </div>
                <div className="text-sm font-medium leading-normal text-lms-ink">{item.stem}</div>
                <div className="mt-3 flex items-center gap-3 text-[11.5px] text-lms-faint">
                  <span>Dùng {item.uses} lần</span><span>· {item.updated}</span><span>· {item.author}</span>
                </div>
              </div>
            );
          })}
        </div>
        <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
        </div>

        <div className="sticky top-0">
          <div className={cardClass(24)}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag p={p} color={p.accent}>{tm.label}</Tag>
                <Tag p={p} color={lm.color}>{lm.label}</Tag>
              </div>
              <div className="flex gap-1.5">
                <IconBtn name="pen" p={p} size={32} onClick={() => (go ? go('bank-edit', { question: q.id }) : setRoute('bank-edit'))} title="Sửa" />
                <IconBtn name="copy" p={p} size={32} title="Nhân bản" onClick={() => duplicate(q)} />
              </div>
            </div>
            <div className="mb-2 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">CHỦ ĐỀ · {q.topic.toUpperCase()}</div>
            <div className="mb-5 text-[17px] font-medium leading-normal text-lms-ink">{q.stem}</div>
            <QuestionView q={qFull} p={p} mode="preview" />
            <div className="mt-[22px] flex gap-4 border-t border-lms-line pt-4 text-xs text-lms-faint">
              <span>Đã dùng {q.uses} lần</span><span>· Cập nhật {q.updated}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export function TBankEdit({ p, t, setRoute }) {
  const [type, setType] = React.useState('single');
  const [level, setLevel] = React.useState('medium');
  const [stem, setStem] = React.useState('');
  const [options, setOptions] = React.useState(['', '', '', '']);
  const [correct, setCorrect] = React.useState([0]);
  const [topic, setTopic] = React.useState('');
  const [topicId, setTopicId] = React.useState<string | null>(() => {
    const t0 = pendingTopicId; pendingTopicId = null; return t0;
  });
  const [fillAns, setFillAns] = React.useState('');
  const [essayGrading, setEssayGrading] = React.useState('rubric');
  const [pairs, setPairs] = React.useState([['', ''], ['', '']]);
  const editId = useSearchParams().get('id');
  React.useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const r: any = await questionsApi.get(editId);
        if (!alive) return;
        const q = r.question || r; const d = r.detail || {};
        setType(q.type); setLevel(q.level || 'medium'); setStem(q.content || '');
        const tref = q.topic ?? q.topicId;
        if (tref) setTopicId(String(tref?._id ?? tref));
        if (q.type === 'single') { setOptions(d.options?.length ? d.options : ['', '', '', '']); setCorrect([d.correctOptionIndex ?? 0]); }
        else if (q.type === 'multi') { setOptions(d.options?.length ? d.options : ['', '', '', '']); setCorrect(d.correctOptionIndices?.length ? d.correctOptionIndices : [0]); }
        else if (q.type === 'truefalse') { setCorrect([d.isCorrect ? 0 : 1]); }
        else if (q.type === 'fill') { setFillAns((d.answers || []).join(' / ')); }
        else if (q.type === 'essay') { setEssayGrading(d.gradingType === 'manual' ? 'manual' : 'rubric'); }
        else if (q.type === 'match') { setPairs((d.pairs || []).map((pp: any) => [pp.left || '', pp.right || ''])); }
      } catch { /* không nạp được → giữ form trống */ }
    })();
    return () => { alive = false; };
  }, [editId]);
  const tm = typeMeta(type);

  const toggleCorrect = (i) => {
    if (type === 'single' || type === 'truefalse') setCorrect([i]);
    else setCorrect(correct.includes(i) ? correct.filter((x) => x !== i) : [...correct, i]);
  };
  const showOptions = type === 'single' || type === 'multi';

  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
      <div onClick={() => setRoute('bank')} className="lms-link mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Ngân hàng câu hỏi
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] items-start gap-6">
        <div className="flex flex-col gap-5">
          <section className={cardClass(24)}>
            <label className={lblClass()}>LOẠI CÂU HỎI</label>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {DB.QTYPES.map((qt) => {
                const on = type === qt.id;
                return (
                  <div key={qt.id} onClick={() => { if (!editId) setType(qt.id); }} className={`lms-row flex cursor-pointer items-center gap-[9px] rounded-xl border px-3 py-[11px] ${on ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'}`}>
                    <Icon name={qt.icon} size={17} stroke={on ? p.accent : p.faint} />
                    <span className={`text-[12.5px] ${on ? 'font-semibold text-lms-accent' : 'font-medium text-lms-sub'}`}>{qt.short}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={cardClass(24)}>
            <label className={lblClass()}>NỘI DUNG CÂU HỎI</label>
            <textarea value={stem} onChange={(e) => setStem(e.target.value)} placeholder="Nhập đề bài. Có thể chèn trích dẫn thơ, đoạn văn…"
              className="mt-2.5 box-border min-h-[90px] w-full resize-y rounded-xl border border-lms-line bg-lms-surface p-[13px] font-sans text-sm leading-relaxed text-lms-ink outline-none" />

            {showOptions && (
              <div className="mt-[18px]">
                <label className={lblClass()}>PHƯƠNG ÁN — bấm vòng tròn để chọn đáp án đúng</label>
                <div className="mt-2.5 flex flex-col gap-2">
                  {options.map((o, i) => {
                    const on = correct.includes(i);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span onClick={() => toggleCorrect(i)} className={`flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center border-[1.8px] ${type === 'multi' ? 'rounded-md' : 'rounded-full'} ${on ? 'border-lms-ok bg-lms-ok' : 'border-lms-faint bg-transparent'}`}>
                          {on && <Icon name="check" size={13} stroke="#fff" sw={2.5} />}</span>
                        <input value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Phương án ${i + 1}`}
                          className="h-10 flex-1 rounded-[10px] border border-lms-line bg-lms-surface px-[13px] font-sans text-[13.5px] text-lms-ink outline-none" />
                        <IconBtn name="trash" p={p} size={36} onClick={() => setOptions(options.filter((_, j) => j !== i))} />
                      </div>
                    );
                  })}
                </div>
                <Btn p={p} variant="quiet" size="sm" icon="plus" className="mt-2.5 pl-0" onClick={() => setOptions([...options, ''])}>Thêm phương án</Btn>
              </div>
            )}

            {type === 'truefalse' && (
              <div className="mt-[18px]">
                <label className={lblClass()}>ĐÁP ÁN ĐÚNG</label>
                <div className="mt-2.5 flex gap-2.5">
                  {['Đúng', 'Sai'].map((lab, i) => (
                    <div key={i} onClick={() => toggleCorrect(i)} className={`flex-1 cursor-pointer rounded-xl border px-3.5 py-3.5 text-center font-semibold ${
                      correct[0] === i ? 'border-lms-ok bg-lms-ok/8 text-lms-ok' : 'border-lms-line bg-lms-surface text-lms-sub'
                    }`}>{lab}</div>
                  ))}
                </div>
              </div>
            )}

            {type === 'fill' && (
              <div className="mt-[18px]">
                <label className={lblClass()}>ĐÁP ÁN (chấp nhận nhiều cách viết, cách nhau bằng dấu /)</label>
                <Field p={p} value={fillAns} onChange={setFillAns} placeholder="vd: hùm / cọp" className="mt-2.5 max-w-[360px]" />
              </div>
            )}

            {type === 'essay' && (
              <div className="mt-[18px]">
                <label className={lblClass()}>CHẤM BẰNG</label>
                <Select p={p} value={essayGrading} onChange={setEssayGrading} className="mt-2.5 max-w-[360px]"
                  options={[{ value: 'rubric', label: 'Rubric Tập làm văn (tả – kể)' }, { value: 'manual', label: 'Cho điểm thủ công' }]} />
              </div>
            )}

            {type === 'match' && (
              <div className="mt-[18px]">
                <label className={lblClass()}>CẶP NỐI</label>
                {pairs.map((pr, i) => (
                  <div key={i} className="mt-2.5 flex items-center gap-2.5">
                    <Field p={p} value={pr[0]} onChange={(v) => setPairs(pairs.map((x, j) => (j === i ? [v, x[1]] : x)))} placeholder="Vế trái" className="flex-1" />
                    <Icon name="link" size={16} stroke={p.faint} />
                    <Field p={p} value={pr[1]} onChange={(v) => setPairs(pairs.map((x, j) => (j === i ? [x[0], v] : x)))} placeholder="Vế phải" className="flex-1" />
                  </div>
                ))}
                <Btn p={p} variant="quiet" size="sm" icon="plus" className="mt-2.5 pl-0" onClick={() => setPairs([...pairs, ['', '']])}>Thêm cặp</Btn>
              </div>
            )}
          </section>

          <section className={cardClass(24)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lblClass()}>ĐỘ KHÓ</label>
                <div className="mt-2.5 flex gap-2">
                  {DB.LEVELS.map((l) => (
                    <div key={l.id} onClick={() => setLevel(l.id)} className={`flex-1 cursor-pointer rounded-[9px] border px-0 py-[9px] text-center text-[12.5px] font-semibold ${
                      level === l.id ? '' : 'border-lms-line bg-lms-surface text-lms-sub'
                    }`}
                      style={level === l.id ? { borderColor: l.color, background: hexA(l.color, 0.1), color: l.color } : undefined}>{l.label}</div>
                  ))}
                </div>
              </div>
              <div>
                <label className={lblClass()}>CHỦ ĐỀ</label>
                {(DB.TOPIC_TREE && DB.TOPIC_TREE.length) ? (
                  <Select p={p} value={topicId ?? ''} onChange={(v) => setTopicId(v || null)} className="mt-2.5"
                    options={[{ value: '', label: '— Không gán chủ đề —' },
                      ...DB.TOPIC_TREE.map((tp: TreeNode) => ({ value: tp.id, label: tp.name }))]} />
                ) : (
                  <Field p={p} value={topic} onChange={setTopic} placeholder="vd: Ngữ pháp N4" className="mt-2.5" />
                )}
              </div>
            </div>
          </section>
        </div>
        <div className="sticky top-0">
          <div className={cardClass(24)}>
            <div className="mb-4 flex items-center gap-2">
              <Icon name="eye" size={16} stroke={p.faint} />
              <span className="font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">XEM TRƯỚC</span>
            </div>
            <div className="mb-3.5 flex gap-2">
              <Tag p={p} color={p.accent}>{tm.label}</Tag>
              <Tag p={p} color={levelMeta(level).color}>{levelMeta(level).label}</Tag>
            </div>
            <div className={`mb-[18px] text-base font-medium leading-normal ${stem ? 'text-lms-ink not-italic' : 'text-lms-faint italic'}`}>
              {stem || 'Nội dung câu hỏi sẽ hiển thị ở đây…'}
            </div>
            <QuestionView q={{ type, options, answer: correct, pairs: [['Tre Việt Nam', 'Nguyễn Duy'], ['Truyện cổ nước mình', 'Lâm Thị Mỹ Dạ']], topic: '' }} p={p} mode="preview" />
          </div>
          <div className="mt-4 flex gap-2.5">
            <Btn p={p} variant="ghost" full onClick={() => setRoute('bank')}>Huỷ</Btn>
            <Btn p={p} icon="check" full onClick={async () => {
              // Filter blank options BEFORE picking the correct index so it stays in range.
              const opts = (type === 'single' || type === 'multi') ? options.filter(Boolean) : [];
              let detail: Record<string, any> = {};
              if (type === 'single') {
                const idx = correct.filter((i) => i < opts.length);
                detail = { options: opts, correctOptionIndex: idx.length ? idx[0] : 0 };
              } else if (type === 'multi') {
                const idx = correct.filter((i) => i < opts.length);
                detail = { options: opts, correctOptionIndices: idx.length ? idx : [0] };
              } else if (type === 'truefalse') {
                detail = { isCorrect: correct[0] === 0 };
              } else if (type === 'fill') {
                const answers = fillAns.split('/').map((x) => x.trim()).filter(Boolean);
                detail = { answers: answers.length ? answers : ['—'] };
              } else if (type === 'essay') {
                detail = { gradingType: essayGrading === 'manual' ? 'manual' : 'rubric' };
              } else if (type === 'match') {
                const ps = pairs.filter(([l, r]) => l.trim() && r.trim()).map(([left, right]) => ({ left: left.trim(), right: right.trim() }));
                detail = { pairs: ps.length ? ps : [{ left: 'Vế trái 1', right: 'Vế phải 1' }, { left: 'Vế trái 2', right: 'Vế phải 2' }] };
              }
              try {
                const topicField = topicId ? { topic: topicId } : {};
                if (editId) await questionsApi.update(editId, { level, content: stem || 'Câu hỏi mới', detail, ...topicField });
                else await questionsApi.create({ type, level, content: stem || 'Câu hỏi mới', detail, ...topicField });
                await hydrateFor('bank');
              } catch {
                if (!editId) LMS && LMS.addQuestion({ type, level, stem: stem || 'Câu hỏi mới',
                  options: (type === 'single' || type === 'multi') ? opts : undefined,
                  answer: correct,
                  pairs: type === 'match' ? [['Vế trái 1', 'Vế phải 1'], ['Vế trái 2', 'Vế phải 2']] : undefined });
              } finally {
                setRoute('bank');
              }
            }}>{editId ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
