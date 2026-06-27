'use client';
import React from 'react';
import { Icon, Tag, Pill, Btn, Field, Select, Progress } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { LMS } from '@/app/store/store';
import { exercisesApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { lblClass, cardClass, ToggleRow } from '@/app/helpers/shared';
import { typeMeta } from '@/app/screens/bank';
import { DOC_TYPE_META } from '@/app/screens/resources';

export function TAssignments({ p, t, setRoute, go }) {
  const [status, setStatus] = React.useState('all');
  const filt = { all: () => true, open: (a) => a.status === 'open' || a.status === 'closing',
    grading: (a) => a.submitted > a.graded, done: (a) => a.status === 'done' };
  const list = DB.ASSIGNMENTS.filter(filt[status]);
  const counts = {
    open: DB.ASSIGNMENTS.filter(filt.open).length, grading: DB.ASSIGNMENTS.filter(filt.grading).length,
    done: DB.ASSIGNMENTS.filter(filt.done).length,
  };
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex flex-wrap items-center gap-2">
        <Pill p={p} active={status === 'all'} onClick={() => setStatus('all')}>Tất cả · {DB.ASSIGNMENTS.length}</Pill>
        <Pill p={p} active={status === 'open'} onClick={() => setStatus('open')}>Đang mở · {counts.open}</Pill>
        <Pill p={p} active={status === 'grading'} onClick={() => setStatus('grading')}>Chờ chấm · {counts.grading}</Pill>
        <Pill p={p} active={status === 'done'} onClick={() => setStatus('done')}>Đã đóng · {counts.done}</Pill>
        <div className="flex-1" />
        <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
      </div>
      <div className="flex flex-col gap-3">
        {list.map((a) => {
          const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
          const toneBg = a.status === 'closing' ? 'bg-lms-warn/12' : a.status === 'done' ? 'bg-lms-ok/12' : 'bg-lms-accent/12';
          const toneText = a.status === 'closing' ? 'text-lms-warn' : a.status === 'done' ? 'text-lms-ok' : 'text-lms-accent';
          const pct = a.total ? Math.round((a.submitted / a.total) * 100) : 0;
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
                  <span>Đã nộp {a.submitted}/{a.total}</span><span className="font-mono">{pct}%</span>
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
    </div>
  );
}

const STEPS = [
  { id: 0, label: 'Thông tin', icon: 'assign' },
  { id: 1, label: 'Nội dung', icon: 'bank' },
  { id: 2, label: 'Cài đặt & giao', icon: 'send' },
];

export function TAssignNew({ p, t, setRoute }) {
  const wizard = (t.assignFlow || 'wizard') === 'wizard';
  const [step, setStep] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [cls, setCls] = React.useState('public');
  const [kind, setKind] = React.useState('quiz');
  // Start with nothing pre-selected — the teacher picks real questions/docs from
  // the (live) bank. Seeding mock ids ('q1'/'q2') made the attach-question step
  // POST non-existent ids → 400s on publish.
  const [picked, setPicked] = React.useState<string[]>([]);
  const [docs, setDocs] = React.useState<string[]>([]);
  const [points, setPoints] = React.useState(10);
  const [rubric, setRubric] = React.useState('none');
  const [due, setDue] = React.useState('26/06/2026 · 23:59');

  const togglePick = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const toggleDoc = (id) => setDocs(docs.includes(id) ? docs.filter((x) => x !== id) : [...docs, id]);
  const visible = (s) => wizard ? step === s : true;

  const StepInfo = (
    <section className={`${cardClass(24)} mb-5`}>
      <h3 className="mb-[18px] m-0 font-lms-heading text-[19px] font-medium text-lms-ink">Thông tin bài tập</h3>
      <label className={lblClass()}>TIÊU ĐỀ</label>
      <Field p={p} value={title} onChange={setTitle} placeholder="vd: Trắc nghiệm đọc hiểu — Dế Mèn bênh vực kẻ yếu" className="mt-2 mb-[18px]" />
      <div className="mb-[18px] grid grid-cols-2 gap-4">
        <div><label className={lblClass()}>PHẠM VI</label>
          <Select p={p} value={cls} onChange={setCls} className="mt-2"
            options={[{ value: 'public', label: 'Công khai cho mọi người' }, { value: 'member', label: 'Chỉ người đã đăng nhập' }]} /></div>
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
      <textarea placeholder="Ghi chú cho học viên…" className="mt-2 box-border w-full min-h-[70px] resize-y rounded-xl border border-lms-line bg-lms-surface p-3 text-sm text-lms-ink outline-none" />
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
          {DB.DOCS.slice(0, 5).map((d) => {
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
        <div><label className={lblClass()}>HẠN NỘP</label><Field p={p} value={due} onChange={setDue} icon="calendar" className="mt-2" /></div>
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
        {[['Cho phép nộp muộn', false], ['Xáo trộn thứ tự câu hỏi', true], ['Hiện điểm ngay sau khi nộp', false], ['Thông báo cho học viên', true]].map(([lab, def], i) => (
          <ToggleRow key={i} p={p} label={lab} def={def} />
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
          : <><Btn p={p} variant="ghost">Lưu nháp</Btn><Btn p={p} variant="accent" icon="send" onClick={async () => {
              // kind ('quiz'|'essay'|'file') already matches the ExerciseType enum.
              // dueDate is NOT bound to state (HẠN NỘP is a display string), so omit it.
              const body: any = { title: title || 'Bài luyện tập mới', type: kind, points: Number(points) || 10, status: 'open' };
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
                LMS && LMS.addAssignment({ title: title || 'Bài luyện tập mới', type: typeLabel, due: 'Sắp tới', dueIn: 'Mới đăng', points: Number(points) || 10, rubric: rubric !== 'none' ? rubric : undefined, questions: kind === 'quiz' ? picked.length : 1 });
              } finally {
                setRoute('assignments');
              }
            }}>Đăng bài luyện tập</Btn></>}
      </div>
    </div>
  );
}
