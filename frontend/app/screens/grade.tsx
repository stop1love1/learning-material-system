'use client';
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Progress, Ring, EmptyState } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { LMS, useLMS } from '@/app/store/store';
import { attemptsApi, settingsApi } from '@/app/lib/api';
import { loadSubmissions, loadSubmissionDetail } from '@/app/lib/sync/load-submissions';
import { confirmDialog, toastSuccess, toastError } from '@/app/lib/ui/dialogs';
import { cardClass } from '@/app/helpers/shared';
import { RubricMatrix } from '@/app/screens/resources';
import { AskAiButton } from '@/app/components/AskAiButton';

// Grading is against the global academic score scale (settings.academic.scoreScale),
// NOT exercise.points. Fall back to 10 when settings are unavailable.
const DEFAULT_SCORE_SCALE = 10;


export function TGrade({ p, t, go }) {
  useLMS();
  const [tab, setTab] = React.useState<'pending' | 'graded'>('pending');
  const subsOf = (aid) => DB.SUBMISSIONS.filter((s) => s.assignmentId === aid);
  const ungraded = (aid) => subsOf(aid).filter((s) => s.status !== 'graded').length;
  const gradedCount = (aid) => subsOf(aid).filter((s) => s.status === 'graded').length;

  const queue = DB.ASSIGNMENTS.filter((a) => ungraded(a.id) > 0);
  const totalPending = queue.reduce((s, a) => s + ungraded(a.id), 0);
  const gradedSubs = DB.SUBMISSIONS
    .filter((s) => s.status === 'graded')
    .map((s) => ({ ...s, assignment: DB.ASSIGNMENTS.find((a) => a.id === s.assignmentId) }));
  const totalGraded = gradedSubs.length;

  const Tabs = () => (
    <div className="mb-5 flex gap-2">
      <Pill p={p} active={tab === 'pending'} onClick={() => setTab('pending')}>Chờ chấm · {totalPending}</Pill>
      <Pill p={p} active={tab === 'graded'} onClick={() => setTab('graded')}>Đã chấm · {totalGraded}</Pill>
    </div>
  );

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className={`${cardClass(24)} mb-[22px] flex items-center gap-5 border-lms-accent/30 bg-lms-accent-soft`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-[15px] bg-lms-accent">
          <Icon name="grade" size={28} stroke="#fff" /></div>
        <div className="flex-1">
          <h2 className="m-0 font-lms-heading text-[26px] font-semibold text-lms-ink">
            {totalPending > 0 ? `${totalPending} bài đang chờ chấm` : 'Đã chấm xong tất cả bài nộp'}
          </h2>
          <div className="mt-1 text-[13.5px] text-lms-sub">
            {totalPending > 0
              ? `Trải đều trên ${queue.length} bài tập · ${totalGraded} bài đã chấm.`
              : `${totalGraded} bài đã chấm · khi có bài nộp mới, bài sẽ xuất hiện ở đây.`}
          </div>
        </div>
        {totalPending > 0 && (
          <Btn p={p} variant="accent" icon="play" onClick={() => go('grade-one', { assignment: queue[0].id })}>Bắt đầu chấm</Btn>
        )}
      </div>

      <Tabs />

      {tab === 'pending' ? (
        queue.length === 0 ? (
          <div className={cardClass(20)}>
            <EmptyState p={p} icon="checkCircle" label="Không còn bài chờ chấm" sub="Chuyển sang tab “Đã chấm” để xem lại các bài đã chấm." />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((a) => {
              const left = ungraded(a.id);
              return (
                <div key={a.id} className={`lms-card ${cardClass(20)} p-[18px]! flex cursor-pointer items-center gap-4`} onClick={() => go('grade-one', { assignment: a.id })}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lms-accent-soft">
                    <Icon name={a.rubric ? 'rubric' : 'grade'} size={20} stroke={p.accent} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[9px]">
                      <span className="text-[14.5px] font-semibold text-lms-ink">{a.title}</span>
                      {a.rubric && <Tag p={p} color={p.accent}>Rubric</Tag>}
                    </div>
                    <div className="mt-1 text-[12.5px] text-lms-sub">{a.type} · hạn {a.due} · đã chấm {gradedCount(a.id)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-lms-heading text-2xl font-semibold leading-none text-lms-accent">{left}</div>
                    <div className="mt-[3px] font-mono text-[10.5px] text-lms-faint">chờ chấm</div>
                  </div>
                  <Btn p={p} variant="soft" size="sm" iconRight="arrowRight" onClick={() => go('grade-one', { assignment: a.id })}>Chấm</Btn>
                </div>
              );
            })}
          </div>
        )
      ) : totalGraded === 0 ? (
        <div className={cardClass(20)}>
          <EmptyState p={p} icon="grade" label="Chưa có bài nào được chấm" sub="Sau khi bạn chấm, các bài đã chấm sẽ hiển thị ở đây để xem lại." />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gradedSubs.map((s) => (
            <div key={s.id} className={`lms-card ${cardClass(20)} p-[16px]! flex cursor-pointer items-center gap-4`} onClick={() => s.assignment && go('grade-one', { assignment: s.assignment.id })}>
              <Avatar name={s.name} p={p} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-lms-ink">{s.name}</div>
                <div className="mt-0.5 truncate text-[12px] text-lms-sub">{s.assignment?.title || 'Bài tập'} · {s.code}{s.at ? ` · ${s.at}` : ''}</div>
              </div>
              <Tag p={p} color={p.ok}>Đã chấm</Tag>
              <div className="text-right">
                <div className="font-lms-heading text-xl font-semibold leading-none text-lms-ok">{s.score ?? '—'}</div>
                <div className="mt-[3px] font-mono text-[10px] text-lms-faint">điểm</div>
              </div>
              <Btn p={p} variant="ghost" size="sm" iconRight="arrowRight" onClick={() => s.assignment && go('grade-one', { assignment: s.assignment.id })}>Xem</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const QUICK_COMMENTS = ['Phân tích sâu, cảm thụ tốt!', 'Cần thêm dẫn chứng tiêu biểu.', 'Chú ý lỗi diễn đạt, chính tả.', 'Bố cục rõ ràng, lập luận thuyết phục.'];

export function TGradeOne({ p, t, ctx, setRoute }) {
  const a = DB.ASSIGNMENTS.find((x) => x.id === ctx.assignment) || DB.ASSIGNMENTS[1] || DB.ASSIGNMENTS[0];
  const useRubric = !!(a && a.rubric);
  const rubric = useRubric ? DB.RUBRICS.find((r) => r.id === a.rubric) : null;
  const subs = DB.SUBMISSIONS.filter((s) => s.assignmentId === a.id);
  const [idx, setIdx] = React.useState(0);
  const sub = subs[idx] || subs[0];

  const [sel, setSel] = React.useState({});
  const [score, setScore] = React.useState('');
  const [fb, setFb] = React.useState('');
  const [draftSaved, setDraftSaved] = React.useState(false);
  const [scoreScale, setScoreScale] = React.useState(DEFAULT_SCORE_SCALE);
  const [, bump] = React.useReducer((n) => n + 1, 0);
  const rubricStyle = t.rubricStyle || 'matrix';

  React.useEffect(() => {
    settingsApi.get().then((s) => { const sc = s?.academic?.scoreScale; if (sc) setScoreScale(sc); }).catch(() => {});
  }, []);

  // List endpoint has meta only; result endpoint has answer content.
  React.useEffect(() => {
    if (!sub || !sub.attemptId || sub.loaded) return;
    let alive = true;
    loadSubmissionDetail(sub.attemptId).then(() => { if (alive) bump(); });
    return () => { alive = false; };
  }, [sub?.attemptId, sub?.loaded]);

  const draftKey = (id) => `lms-grade-draft-${id}`;
  React.useEffect(() => {
    if (!sub || typeof window === 'undefined') return;
    setDraftSaved(false);
    try {
      const raw = localStorage.getItem(draftKey(sub.id));
      if (raw) {
        const d = JSON.parse(raw);
        if (d.score != null) setScore(String(d.score));
        if (d.fb != null) setFb(d.fb);
        if (d.sel) setSel(d.sel);
      }
    } catch {}
  }, [sub?.id]);

  const saveDraft = () => {
    if (!sub || typeof window === 'undefined') return;
    try {
      localStorage.setItem(draftKey(sub.id), JSON.stringify({ score, fb, sel }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch {}
  };
  const clearDraft = (id) => { if (typeof window !== 'undefined') try { localStorage.removeItem(draftKey(id)); } catch {} };

  const rubricScore = React.useMemo(() => {
    if (!rubric) return null;
    let sum = 0, any = false;
    rubric.criteria.forEach((c, ci) => { if (sel[ci] != null) { any = true; sum += c.weight * rubric.scale[sel[ci]].pct / 100; } });
    return any ? Math.round((sum / 10) * 10) / 10 : null;
  }, [sel, rubric]);
  React.useEffect(() => { if (rubricScore != null) setScore(String(rubricScore)); }, [rubricScore]);

  const reset = (i) => { setIdx(i); setSel({}); setScore(''); setFb(''); };
  const gradedCount = subs.filter((s) => s.status === 'graded').length;

  // Rubric breakdown has no backend field — store as text in first essay feedback.
  const rubricBreakdownText = () => {
    if (!rubric) return '';
    const lines = rubric.criteria
      .map((c, ci) => (sel[ci] != null ? `${c.name}: ${rubric.scale[sel[ci]]?.label ?? ''}` : null))
      .filter(Boolean);
    return lines.length ? `[Rubric] ${lines.join(' · ')}` : '';
  };

  const persistGrade = async (s, finalScore, feedback) => {
    if (s && s.attemptId) {
      try {
        // Send totalScore only — not per-question grades; attach rubric breakdown to first answer feedback.
        const breakdown = rubricBreakdownText();
        const qs: any[] = Array.isArray(s.questions) ? s.questions : [];
        const answers = qs.map((q, i) => ({
          questionId: q.questionId,
          ...(i === 0 && breakdown ? { feedback: breakdown } : {}),
        })).filter((q) => q.questionId);
        await attemptsApi.grade(s.attemptId, {
          answers,
          totalScore: Number(finalScore) || 0,
          feedback: feedback || '',
        });
        await loadSubmissions();
      } catch (e: any) {
        toastError(e?.message || 'Không lưu được điểm. Vui lòng thử lại.');
      }
    }
  };

  if (!a) {
    return (
      <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
        <div className={`${cardClass(20)} mt-10`}>
          <EmptyState p={p} icon="grade" label="Không có bài tập" sub="Chưa có nội dung." action={<Btn p={p} variant="soft" size="sm" icon="arrowLeft" onClick={() => setRoute('grade')} className="mt-1">Về hàng chờ</Btn>} />
        </div>
      </div>
    );
  }

  if (subs.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-4 border-b border-lms-line px-[30px] py-4">
          <div onClick={() => setRoute('grade')} className="lms-link inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
            <Icon name="arrowLeft" size={16} stroke={p.sub} /> Hàng chờ</div>
          <div className="h-[26px] w-px bg-lms-line" />
          <div className="text-[15px] font-semibold text-lms-ink">{a.title}</div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState p={p} icon="grade" label="Chưa có bài nộp" sub="Khi người dùng nộp bài, bài sẽ xuất hiện ở đây để bạn chấm." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-lms-line px-[30px] py-4">
        <div onClick={() => setRoute('grade')} className="lms-link inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
          <Icon name="arrowLeft" size={16} stroke={p.sub} /> Hàng chờ
        </div>
        <div className="h-[26px] w-px bg-lms-line" />
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-lms-ink">{a.title}</div>
          <div className="mt-px text-xs text-lms-faint">{useRubric ? rubric.name : 'Chấm điểm số'}</div>
        </div>
        <div className="lms-hide-sm flex shrink-0 items-center gap-2.5">
          <span className="font-mono text-xs text-lms-sub">Đã chấm {gradedCount}/{subs.length}</span>
          <div className="w-[120px]"><Progress p={p} value={(gradedCount / subs.length) * 100} height={6} /></div>
        </div>
      </div>

      <div className={`grid grid-cols-1 min-h-0 flex-1 ${t.railWide ? 'min-[961px]:grid-cols-[240px_minmax(0,1fr)]' : 'min-[961px]:grid-cols-[216px_minmax(0,1fr)]'}`}>
        <div className="lms-scroll overflow-y-auto border-r border-lms-line p-3">
          <div className="px-2.5 pt-1.5 pb-2 font-mono text-[10px] tracking-[0.5px] text-lms-faint">BÀI NỘP · {subs.length}</div>
          {subs.map((s, i) => {
            const on = i === idx;
            return (
              <div key={s.id} onClick={() => reset(i)} className={`lms-nav-item mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[10px] px-[11px] py-2.5 ${on ? 'bg-lms-active-bg' : 'bg-transparent'}`}>
                <Avatar name={s.name} p={p} size={32} accent={on} />
                <div className="min-w-0 flex-1">
                  <div className={`overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] ${on ? 'font-semibold text-lms-ink' : 'font-medium text-lms-ink'}`}>{s.name}</div>
                  <div className="font-mono text-[10px] text-lms-faint">{s.code}</div>
                </div>
                {s.status === 'graded'
                  ? <span className="font-lms-heading text-[15px] font-semibold text-lms-ok">{s.score}</span>
                  : <span className="h-[7px] w-[7px] rounded bg-lms-accent" />}
              </div>
            );
          })}
        </div>
        <div className="lms-scroll min-w-0 overflow-y-auto">
          <div className="flex flex-wrap items-start">
        <div className="min-w-0 flex-[1_1_440px] px-8 py-[26px]">
          <div className="mx-auto max-w-[640px]">
            <div className="mb-[22px] flex items-center gap-3.5">
              <Avatar name={sub.name} p={p} size={46} accent />
              <div className="flex-1">
                <div className="text-base font-semibold text-lms-ink">{sub.name}</div>
                <div className="mt-0.5 font-mono text-[11.5px] text-lms-faint">{sub.code} · nộp {sub.at}</div>
              </div>
              {sub.status === 'graded' && <Tag p={p} color={p.ok}>Đã chấm · {sub.score}</Tag>}
            </div>

            <div className="mb-3.5 flex items-center gap-2.5">
              <Tag p={p} color={p.sub}>BÀI LÀM</Tag>
              <span className="font-mono text-[11px] text-lms-faint">{sub.wordcount} chữ</span>
              <div className="flex-1" />
              <AskAiButton p={p} label="Tham khảo AI" copyText={sub.text} className="shrink-0" />
            </div>
            {/* Essay answers are rich text (HTML from the editor); render safely. */}
            {/[<][a-z]/i.test(sub.text || '')
              ? <div className={`lms-rich ${cardClass(24)} p-[26px]! text-base leading-[1.9] tracking-[0.2px] text-lms-ink`} dangerouslySetInnerHTML={{ __html: sub.text }} />
              : <div className={`${cardClass(24)} p-[26px]! text-base leading-[1.9] tracking-[0.2px] text-lms-ink whitespace-pre-wrap`}>{sub.text}</div>}

            <div className="mt-[22px] flex items-center justify-between gap-3">
              <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => reset((idx - 1 + subs.length) % subs.length)}>Bài trước</Btn>
              <div className="flex-1" />
              <Btn p={p} variant="ghost" iconRight="arrowRight" onClick={() => reset((idx + 1) % subs.length)}>Bài sau</Btn>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_340px] self-stretch border-l border-lms-line bg-lms-rail-bg p-[22px]">
          {useRubric && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">CHẤM THEO RUBRIC</span>
                <Tag p={p} color={p.accent}>{Object.keys(sel).length}/{rubric.criteria.length} tiêu chí</Tag>
              </div>
              {rubricStyle === 'matrix' && (
                <div className="mb-[18px] overflow-x-auto">
                  <RubricMatrix rubric={rubric} p={p} mode="grade" selected={sel} onSelect={(ci, si) => setSel({ ...sel, [ci]: si })} />
                </div>
              )}
              {rubricStyle === 'cards' && (
                <div className="mb-[18px] flex flex-col gap-3">
                  {rubric.criteria.map((c, ci) => (
                    <div key={ci} className={`${cardClass(16)} p-[14px]!`}>
                      <div className="mb-[9px] flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-lms-ink">{c.name}</span>
                        <Tag p={p} color={p.accent}>{c.weight}%</Tag>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rubric.scale.map((s, si) => {
                          const on = sel[ci] === si;
                          return (
                            <button key={si} onClick={() => setSel({ ...sel, [ci]: si })} className={`min-w-16 flex-1 cursor-pointer rounded-[9px] border px-1.5 py-2 text-[11px] ${on ? 'border-lms-accent bg-lms-accent-soft font-semibold text-lms-accent' : 'border-lms-line bg-lms-surface font-medium text-lms-sub'}`}>
                              {s.label}<div className="mt-0.5 font-mono text-[10px] text-lms-faint">{((c.weight * s.pct) / 1000).toFixed(1)}đ</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className={`${cardClass(20)} p-[18px]! mb-4 flex items-center gap-4`}>
            <div className="flex-1">
              <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">ĐIỂM SỐ {useRubric ? '(từ rubric, có thể chỉnh)' : ''}</div>
              <div className="flex items-baseline gap-1">
                <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="—"
                  className="w-[70px] border-none bg-transparent font-lms-heading text-[40px] font-semibold tracking-[-1px] text-lms-accent outline-none" />
                <span className="text-lg text-lms-faint">/ {scoreScale}</span>
              </div>
            </div>
            <Ring value={score ? (Number(score) / scoreScale) * 100 : 0} size={62} thickness={7} p={p} color={p.accent}
              label={score ? Number(score).toFixed(1) : '—'} />
          </div>
          <div className="mb-2 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">NHẬN XÉT</div>
          <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Nhận xét cho người dùng…"
            className="box-border w-full min-h-[86px] resize-y rounded-xl border border-lms-line bg-lms-surface p-3 text-[13px] leading-relaxed text-lms-ink outline-none" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {QUICK_COMMENTS.map((qc, i) => (
              <button key={i} onClick={() => setFb(fb ? fb + ' ' + qc : qc)} className="cursor-pointer rounded-xl border border-lms-line bg-lms-surface px-2.5 py-[5px] text-[11.5px] text-lms-sub">+ {qc}</button>
            ))}
          </div>

          <div className="mt-5 flex gap-2.5">
            <Btn p={p} variant="ghost" full icon={draftSaved ? 'check' : 'docs'} onClick={saveDraft}>{draftSaved ? 'Đã lưu nháp' : 'Lưu nháp'}</Btn>
            <Btn p={p} variant="accent" full icon="check" onClick={async () => {
              const effective = score || rubricScore;
              if (effective == null || effective === '') {
                if (!(await confirmDialog({ title: 'Chưa nhập điểm', content: 'Vẫn lưu bài này với điểm 0?', okText: 'Lưu điểm 0' }))) return;
              }
              await persistGrade(sub, effective || 0, fb);
              clearDraft(sub.id);
              toastSuccess('Đã lưu điểm.');
              reset((idx + 1) % subs.length);
            }}>Lưu & bài tiếp</Btn>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
