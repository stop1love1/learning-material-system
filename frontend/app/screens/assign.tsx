'use client';
import React from 'react';
import { Icon, Tag, Pill, Btn, Field, Select, Progress } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { LMS } from '@/app/store/store';
import { exercisesApi, exerciseFoldersApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { FolderTree } from '@/app/components/FolderTree';
import { Pagination } from '@/app/components/Pagination';
import { FilterSelect } from '@/app/components/FilterSelect';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapExercise } from '@/app/lib/sync/load-exercises';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { typeMeta } from '@/app/screens/bank';
import { DOC_TYPE_META } from '@/app/screens/resources';

// Backend ExerciseType / ExerciseStatus enum values → Vietnamese labels for the filters.
export const EX_TYPE_OPTS = [
  { value: 'quiz', label: 'Trắc nghiệm' },
  { value: 'essay', label: 'Tự luận' },
  { value: 'file', label: 'Nộp tệp' },
];
export const EX_STATUS_OPTS = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'open', label: 'Đang mở' },
  { value: 'closing', label: 'Sắp đóng' },
  { value: 'closed', label: 'Đã đóng' },
];

export function TAssignments({ p, t, setRoute, go, auth }) {
  const [selFolder, setSelFolder] = React.useState<string | null>(null);

  const canManage = !!auth?.isStaff;
  const folders = (DB as any).EX_FOLDERS || [];

  // Server-side paginated exercises list (keyword + folder + type + status filters).
  const paged = usePagedResource<any>({ fetcher: exercisesApi.list, mapper: mapExercise });
  const { records: list, loading, error } = paged;

  const refresh = async () => { await hydrateFor('assignments'); paged.reload(); };

  const onSelectFolder = (id: string | null) => { setSelFolder(id); paged.setFilter('folderId', id); };

  // Per-folder exercise tally for the tree badges (from the sidebar DB snapshot).
  const folderCounts: Record<string, number> = {};
  for (const a of DB.ASSIGNMENTS) {
    const fid = a.folderId ? String(a.folderId) : null;
    if (fid) folderCounts[fid] = (folderCounts[fid] || 0) + 1;
  }
  const treeNodes = folders.map((f) => ({ ...f, count: folderCounts[f.id] || 0 }));

  const onAddRoot = async () => {
    const name = window.prompt('Tên thư mục mới')?.trim();
    if (!name) return;
    try { await exerciseFoldersApi.create({ name, parentId: null }); await refresh(); }
    catch (e: any) { window.alert(e?.message || 'Không tạo được thư mục.'); }
  };
  const onAddChild = async (parentId: string) => {
    const name = window.prompt('Tên thư mục con')?.trim();
    if (!name) return;
    try { await exerciseFoldersApi.create({ name, parentId }); await refresh(); }
    catch (e: any) { window.alert(e?.message || 'Không tạo được thư mục.'); }
  };
  const onRename = async (node) => {
    const name = window.prompt('Đổi tên thư mục', node.name)?.trim();
    if (!name || name === node.name) return;
    try { await exerciseFoldersApi.update(node.id, { name }); await refresh(); }
    catch (e: any) { window.alert(e?.message || 'Không đổi tên được.'); }
  };
  const onDelete = async (node) => {
    if (!window.confirm(`Xoá thư mục "${node.name}"?`)) return;
    try {
      await exerciseFoldersApi.remove(node.id);
      if (selFolder === node.id) onSelectFolder(null);
      await refresh();
    } catch (e: any) { window.alert(e?.message || 'Không xoá được thư mục (thư mục có thể chưa rỗng).'); }
  };

  return (
    <div className="lms-content-pad mx-auto flex max-w-[1480px] gap-6 px-[30px] pt-6 pb-10">
      <aside className="hidden w-[240px] shrink-0 lg:block">
        <FolderTree
          nodes={treeNodes}
          selectedId={selFolder}
          onSelect={onSelectFolder}
          p={p}
          allLabel="Tất cả bài tập / đề thi"
          allCount={paged.total}
          onAddRoot={canManage ? onAddRoot : undefined}
          onAddChild={canManage ? onAddChild : undefined}
          onRename={canManage ? onRename : undefined}
          onDelete={canManage ? onDelete : undefined}
        />
      </aside>
      <div className="min-w-0 flex-1">
      <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
        <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm bài tập…" className="w-[240px]" />
        <FilterSelect label="HÌNH THỨC" p={p} value={paged.filters.type} options={EX_TYPE_OPTS} onChange={(v) => paged.setFilter('type', v)} />
        <FilterSelect label="TRẠNG THÁI" p={p} value={paged.filters.status} options={EX_STATUS_OPTS} onChange={(v) => paged.setFilter('status', v)} />
        <div className="flex-1" />
        <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
      </div>
      {loading ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">Đang tải…</div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">{error ? 'Không tải được dữ liệu' : 'Không có kết quả'}</div>
      ) : (
      <div className="flex flex-col gap-3">
        {list.map((a) => {
          const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
          const toneBg = a.status === 'closing' ? 'bg-lms-warn/12' : a.status === 'done' ? 'bg-lms-ok/12' : 'bg-lms-accent/12';
          const toneText = a.status === 'closing' ? 'text-lms-warn' : a.status === 'done' ? 'text-lms-ok' : 'text-lms-accent';
          // Tiến độ CHẤM (đã chấm / đã nộp). Không còn sĩ số lớp làm mẫu số tổng nên
          // thanh tiến độ thể hiện mức độ chấm xong trên số bài đã nộp.
          const pct = a.submitted ? Math.round((a.graded / a.submitted) * 100) : 0;
          return (
            <div key={a.id} className={`lms-card ${cardClass(20)} flex cursor-pointer items-center gap-[18px]`} onClick={() => go('grade-one', { assignment: a.id })}>
              <div className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl ${toneBg}`}>
                <Icon name="assign" size={21} stroke={tone} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-semibold text-lms-ink">{a.title}</span>
                  {a.rubric && <Tag p={p} color={p.accent}>Rubric</Tag>}
                </div>
                <div className="mt-[5px] flex flex-wrap gap-3 text-[12.5px] text-lms-sub">
                  <span>{a.type}</span><span>· {a.questions} câu · {a.points}đ</span>
                  <span className={`font-mono ${toneText}`}>· {a.dueIn}</span>
                </div>
              </div>
              <div className="w-[150px]">
                <div className="mb-[5px] flex justify-between text-[11px] text-lms-faint">
                  <span>Đã chấm {a.graded}/{a.submitted}</span><span className="font-mono">{pct}%</span>
                </div>
                <Progress p={p} value={pct} height={6} />
              </div>
              <div className="min-w-[110px] text-center">
                {a.submitted > a.graded ? <Btn p={p} variant="soft" size="sm" icon="grade" onClick={() => go('grade-one', { assignment: a.id })}>Chấm {a.submitted - a.graded}</Btn>
                  : <Tag p={p} color={p.ok}>Đã chấm xong</Tag>}
              </div>
            </div>
          );
        })}
      </div>
      )}
      <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
      </div>
    </div>
  );
}

const STEPS = [
  { id: 0, label: 'Thông tin', icon: 'assign' },
  { id: 1, label: 'Nội dung', icon: 'bank' },
  { id: 2, label: 'Cài đặt & giao', icon: 'send' },
];

export function TAssignNew({ p, t, setRoute, ctx }) {
  const wizard = (t.assignFlow || 'wizard') === 'wizard';
  const [step, setStep] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [kind, setKind] = React.useState('quiz');
  // Start with nothing pre-selected — the teacher picks real questions/docs from
  // the (live) bank. Seeding mock ids ('q1'/'q2') made the attach-question step
  // POST non-existent ids → 400s on publish.
  const [picked, setPicked] = React.useState<string[]>([]);
  const [docs, setDocs] = React.useState<string[]>([]);
  const [points, setPoints] = React.useState(10);
  const [rubric, setRubric] = React.useState('none');
  // HẠN NỘP as an <input type="datetime-local"> value (yyyy-MM-ddTHH:mm) so it binds
  // to real state and serialises to a proper ISO dueDate on publish.
  const [due, setDue] = React.useState('2026-06-26T23:59');
  const [instructions, setInstructions] = React.useState('');
  // 4 cài đặt giao bài (controlled) → allowLateSubmit / shuffleQuestions / showScoreAfter / notifyOnAssign.
  const [allowLate, setAllowLate] = React.useState(false);
  const [shuffle, setShuffle] = React.useState(true);
  const [showScore, setShowScore] = React.useState(false);
  const [notify, setNotify] = React.useState(true);
  // Default to the folder selected in the tree sidebar (passed via ctx by ScreenHost),
  // falling back to "no folder". Lets newly-created exercises land in "Kho đề thi" folders.
  const [folder, setFolder] = React.useState<string>(ctx?.folderId ? String(ctx.folderId) : '');
  const exFolders = (DB as any).EX_FOLDERS || [];

  const togglePick = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const toggleDoc = (id) => setDocs(docs.includes(id) ? docs.filter((x) => x !== id) : [...docs, id]);
  const visible = (s) => wizard ? step === s : true;

  // datetime-local (yyyy-MM-ddTHH:mm) → ISO string for dueDate; '' when unset.
  const dueIso = () => {
    if (!due) return undefined;
    const d = new Date(due);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  // Gom toàn bộ cài đặt wizard thành payload create/update exercise. `status` quyết
  // định 'draft' (Lưu nháp) hay 'open' (Đăng / giao bài).
  const buildBody = (status: string) => {
    const body: any = {
      // kind ('quiz'|'essay'|'file') already matches the ExerciseType enum.
      title: title || 'Bài luyện tập mới',
      type: kind,
      points: Number(points) || 10,
      status,
      shuffleQuestions: shuffle,
      allowLateSubmit: allowLate,
      showScoreAfter: showScore,
      notifyOnAssign: notify,
    };
    if (folder) body.folderId = folder;
    if (instructions.trim()) body.instructions = instructions.trim();
    if (rubric && rubric !== 'none') body.rubricId = rubric;
    const iso = dueIso();
    if (iso) body.dueDate = iso;
    // Tài liệu đính kèm (DB.DOCS[].id là FileItem _id) → materialIds, áp dụng cho
    // mọi hình thức (kể cả tự luận / nộp tệp, không chỉ trắc nghiệm).
    if (docs.length) body.materialIds = docs;
    return body;
  };

  // Tạo exercise rồi (chỉ với hình thức trắc nghiệm) đính câu hỏi đã chọn.
  const save = async (status: string) => {
    const body = buildBody(status);
    try {
      const ex: any = await exercisesApi.create(body);
      const exId = ex?._id ?? ex?.id;
      if (exId && kind === 'quiz') {
        for (const questionId of picked) {
          try { await exercisesApi.addQuestion(exId, { questionId }); } catch { /* skip unknown/mock ids */ }
        }
      }
      await hydrateFor('assignments');
    } catch {
      // offline / logged-out fallback: keep the mock store behaviour
      const typeLabel = kind === 'quiz' ? 'Trắc nghiệm' : kind === 'essay' ? 'Tự luận' : 'Nộp tệp';
      LMS && LMS.addAssignment({ title: title || 'Bài luyện tập mới', type: typeLabel, due: 'Sắp tới', dueIn: status === 'draft' ? 'Bản nháp' : 'Mới đăng', points: Number(points) || 10, rubric: rubric !== 'none' ? rubric : undefined, questions: kind === 'quiz' ? picked.length : docs.length });
    } finally {
      setRoute('assignments');
    }
  };

  const StepInfo = (
    <section className={`${cardClass(24)} mb-5`}>
      <h3 className="mb-[18px] m-0 font-lms-heading text-[19px] font-medium text-lms-ink">Thông tin bài tập</h3>
      <label className={lblClass()}>TIÊU ĐỀ</label>
      <Field p={p} value={title} onChange={setTitle} placeholder="vd: Trắc nghiệm đọc hiểu — Dế Mèn bênh vực kẻ yếu" className="mt-2 mb-[18px]" />
      <div className="mb-[18px]">
        <label className={lblClass()}>THƯ MỤC (Kho đề thi)</label>
        <Select p={p} value={folder} onChange={setFolder} className="mt-2"
          options={[{ value: '', label: 'Không xếp vào thư mục' }, ...exFolders.map((f) => ({ value: f.id, label: f.name }))]} />
      </div>
      <div className="mb-[18px]">
        <div><label className={lblClass()}>HÌNH THỨC</label>
          <div className="mt-2 flex gap-2">
            {[['quiz', 'Trắc nghiệm', 'bank'], ['essay', 'Tự luận', 'docs'], ['file', 'Nộp tệp', 'upload']].map(([k, lab, ic]) => (
              <div key={k} onClick={() => setKind(k)} className={`lms-row flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-[11px] ${kind === k ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'}`}>
                <Icon name={ic} size={18} stroke={kind === k ? p.accent : p.faint} />
                <span className={`text-xs ${kind === k ? 'font-semibold text-lms-accent' : 'font-medium text-lms-sub'}`}>{lab}</span>
              </div>
            ))}
          </div></div>
      </div>
      <label className={lblClass()}>HƯỚNG DẪN (tuỳ chọn)</label>
      <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ghi chú cho học viên…" className="mt-2 box-border w-full min-h-[70px] resize-y rounded-xl border border-lms-line bg-lms-surface p-3 text-sm text-lms-ink outline-none" />
    </section>
  );

  const StepContent = (
    <section className={`${cardClass(24)} mb-5`}>
      <div className="mb-[18px] flex items-center justify-between">
        <h3 className="m-0 font-lms-heading text-[19px] font-medium text-lms-ink">
          {kind === 'quiz' ? 'Chọn câu hỏi từ ngân hàng' : 'Đính kèm tài liệu'}</h3>
        {kind === 'quiz' && <Tag p={p} color={p.accent}>{picked.length} câu đã chọn</Tag>}
      </div>
      {kind === 'quiz' ? (
        <div className="flex flex-col gap-2">
          {DB.QUESTIONS.map((q) => {
            const on = picked.includes(q.id), tm = typeMeta(q.type);
            return (
              <div key={q.id} onClick={() => togglePick(q.id)} className={`lms-row flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-[11px] ${on ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-[1.8px] ${on ? 'border-lms-accent bg-lms-accent' : 'border-lms-faint bg-transparent'}`}>
                  {on && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}</span>
                <Icon name={tm.icon} size={16} stroke={p.faint} />
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-lms-ink">{q.stem}</span>
                <Tag p={p} color={p.sub}>{tm.short}</Tag>
              </div>
            );
          })}
          <Btn p={p} variant="quiet" size="sm" icon="plus" className="mt-1.5 pl-0!" onClick={() => setRoute('bank-edit')}>Soạn câu hỏi mới</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {DB.DOCS.map((d) => {
            const on = docs.includes(d.id), m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => toggleDoc(d.id)} className={`lms-row flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-[11px] ${on ? 'border-lms-accent bg-lms-accent-soft' : 'border-lms-line bg-lms-surface'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-[1.8px] ${on ? 'border-lms-accent bg-lms-accent' : 'border-lms-faint bg-transparent'}`}>
                  {on && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}</span>
                <Icon name={m.icon} size={16} stroke={p.faint} />
                <span className="flex-1 text-[13.5px] text-lms-ink">{d.name}</span>
                <span className="font-mono text-[11px] text-lms-faint">{d.size}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const StepSettings = (
    <section className={`${cardClass(24)} mb-5`}>
      <h3 className="mb-[18px] m-0 font-lms-heading text-[19px] font-medium text-lms-ink">Cài đặt & giao bài</h3>
      <div className="mb-[18px] grid grid-cols-2 gap-4">
        <div><label className={lblClass()}>HẠN NỘP</label>
          <div className="mt-2 flex h-10 items-center gap-2.5 rounded-[10px] border border-lms-line bg-lms-surface px-[13px]">
            <Icon name="calendar" size={16} stroke={p.faint} />
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)}
              className="flex-1 border-none bg-transparent text-sm text-lms-ink outline-none" />
          </div></div>
        <div><label className={lblClass()}>ĐIỂM TỐI ĐA</label>
          <div className="mt-2 flex h-10 items-center gap-2.5 rounded-[10px] border border-lms-line bg-lms-surface px-[13px]">
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))}
              className="flex-1 border-none bg-transparent font-mono text-sm text-lms-ink outline-none" />
            <span className="text-[12.5px] text-lms-faint">điểm</span>
          </div></div>
      </div>
      <label className={lblClass()}>CHẤM BẰNG RUBRIC</label>
      <Select p={p} value={rubric} onChange={setRubric} className="mt-2 mb-[18px]"
        options={[{ value: 'none', label: 'Không dùng rubric — chấm điểm số' }, ...DB.RUBRICS.map((r) => ({ value: r.id, label: r.name }))]} />
      <div className="flex flex-col gap-2.5">
        {([
          ['Cho phép nộp muộn', allowLate, setAllowLate],
          ['Xáo trộn thứ tự câu hỏi', shuffle, setShuffle],
          ['Hiện điểm ngay sau khi nộp', showScore, setShowScore],
          ['Thông báo cho học viên', notify, setNotify],
        ] as [string, boolean, (v: boolean) => void][]).map(([lab, on, setOn], i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-lms-line bg-lms-raise px-3.5 py-[11px]">
            <span className="text-[13.5px] text-lms-ink">{lab}</span>
            <div onClick={() => setOn(!on)}
              className={`flex h-6 w-[42px] cursor-pointer rounded-xl p-0.5 transition-colors ${on ? 'bg-lms-accent justify-end' : 'bg-lms-sink justify-start'}`}>
              <div className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
      <div onClick={() => setRoute('assignments')} className="lms-link mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Bài tập
      </div>

      {wizard && (
        <div className="mb-6 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = step > s.id, on = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div onClick={() => setStep(s.id)} className="flex cursor-pointer items-center gap-2.5">
                  <div className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border ${on ? 'border-lms-accent bg-lms-accent text-white' : done ? 'border-lms-accent bg-lms-accent-soft text-lms-accent' : 'border-lms-line bg-lms-sink text-lms-faint'}`}>
                    {done ? <Icon name="check" size={16} stroke={p.accent} sw={2.4} /> : <span className="font-mono text-sm font-semibold">{i + 1}</span>}
                  </div>
                  <span className={`text-[13.5px] ${on ? 'font-semibold text-lms-ink' : 'font-medium text-lms-sub'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-4 h-px flex-1 ${done ? 'bg-lms-accent' : 'bg-lms-line'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {visible(0) && StepInfo}
      {visible(1) && StepContent}
      {visible(2) && StepSettings}

      <div className="mt-2 flex justify-end gap-3">
        {wizard && step > 0 && <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => setStep(step - 1)}>Quay lại</Btn>}
        {wizard && step < 2
          ? <Btn p={p} iconRight="arrowRight" onClick={() => setStep(step + 1)}>Tiếp tục</Btn>
          : <><Btn p={p} variant="ghost" onClick={() => save('draft')}>Lưu nháp</Btn><Btn p={p} variant="accent" icon="send" onClick={() => save('open')}>Đăng bài luyện tập</Btn></>}
      </div>
    </div>
  );
}
