'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Empty } from 'antd';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Ring, Spark, EmptyState } from '@/app/components/ui';
import { DB, LMS, useLMS } from '@/app/store/store';
import { filesApi, exercisesApi, attemptsApi, selfAssessmentsApi, settingsApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { cardClass, lblClass } from '@/app/helpers/shared';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { DOC_TYPE_META, RubricMatrix } from '@/app/screens/resources';
import { DocCardMini } from '@/app/screens/teacher';
import { levelMeta, QuestionView } from '@/app/screens/bank';

function taskTone(p, s) { return { todo: p.accent, done: p.info, graded: p.ok }[s] || p.sub; }
function taskLabel(s) { return { todo: 'Cần làm', done: 'Đã nộp', graded: 'Đã chấm' }[s] || s; }
function taskIconBg(s: string) { return { todo: 'bg-lms-accent-soft', done: 'bg-lms-info/12', graded: 'bg-lms-ok/12' }[s] || 'bg-lms-accent-soft'; }

const TASK_TABS = ['todo', 'done', 'all'] as const;
type TaskTab = (typeof TASK_TABS)[number];

function parseTaskTab(raw: string | null): TaskTab {
  return TASK_TABS.includes(raw as TaskTab) ? (raw as TaskTab) : 'todo';
}

function HomeSection({
  title,
  linkLabel,
  onLink,
  empty,
  emptyDescription,
  contentClassName,
  children,
}: {
  title: string;
  linkLabel: string;
  onLink: () => void;
  empty: boolean;
  emptyDescription: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="reveal mb-4 flex items-baseline justify-between">
        <h2 className="m-0 font-lms-heading text-2xl font-extrabold tracking-[-0.6px] text-lms-ink">{title}</h2>
        <span onClick={onLink} className="cursor-pointer text-[13px] font-semibold text-lms-accent">{linkLabel}</span>
      </div>
      {empty ? (
        <div className={`reveal ${contentClassName || 'mb-10'}`}>
          <div className="rounded-xl border border-lms-line bg-lms-surface py-10">
            <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}

export function UserHome({ p, t, setRoute, go }) {
  useLMS();
  const [hp, setHp] = React.useState<any>(null);
  React.useEffect(() => { settingsApi.get().then((s) => setHp(s?.homepage)).catch(() => {}); }, []);
  const featured = DB.DOCS.slice(0, 6);
  const cats = (DB.DOC_FOLDERS || []).filter((f) => f !== 'Tất cả');
  const exercise = DB.STUDENT_TASKS.find((x) => x.status === 'todo') || DB.STUDENT_TASKS[0];
  const lead = DB.ARTICLES[0];
  const heroDoc = DB.DOCS[0];
  const latestArticles = DB.ARTICLES.slice(0, 3);
  const catIcons = ['book', 'docs', 'video', 'rubric', 'report', 'bulb', 'pen', 'star'];

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-7 pb-2 max-sm:px-4">
      <div className="bento mb-4">
        <div className="col-8 row-2 reveal bento-tile relative flex min-h-[320px] flex-col justify-center overflow-hidden border border-lms-line bg-[image:var(--lms-hero-gradient)] p-[38px]">
          <span className="mb-[18px] inline-flex items-center gap-[7px] self-start rounded-[20px] border border-lms-line bg-lms-surface px-3 py-[5px] text-[11.5px] font-bold text-lms-accent">
            <Icon name="flame" size={14} stroke={p.accent} /> {hp?.badge || 'TÀI NGUYÊN NGỮ VĂN · MIỄN PHÍ'}
          </span>
          <h1 className="m-0 max-w-[620px] font-lms-heading text-[clamp(30px,4.4vw,50px)] font-extrabold leading-[1.04] tracking-[-1.4px] text-lms-ink">
            {hp?.heroTitle || 'Học Văn nhẹ nhàng, tài liệu mở cho tất cả.'}
          </h1>
          <p className="mt-[18px] mb-6 max-w-[480px] text-base leading-relaxed text-lms-sub">
            {hp?.heroSubtitle || 'Mình chia sẻ miễn phí kho tài liệu, đề thi, bài giảng và bài tập Ngữ văn Tiểu học — ai cũng có thể đọc, luyện tập và tải về.'}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setRoute('s-docs'); }} className="flex max-w-[540px] flex-wrap gap-2.5">
            <Field p={p} icon="search" value="" onChange={() => {}} placeholder="Tìm tài liệu, tác phẩm, chủ đề…" className="min-w-[200px] flex-1! h-[50px]! rounded-xl!" />
            <Btn p={p} size="lg" icon="arrowRight" onClick={() => setRoute('s-docs')} className="rounded-xl!">{hp?.ctaLabel || 'Khám phá'}</Btn>
          </form>
        </div>
        <div className="col-4 reveal bento-tile hovlift flex cursor-default flex-col gap-3.5 border border-lms-line bg-lms-surface p-6 text-lms-ink">
          <div className="flex items-center gap-[13px]">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-lms-accent font-lms-heading text-[22px] font-bold text-white">PT</div>
            <div>
              <div className="text-[15.5px] font-bold text-lms-ink">Cô Phương Thanh</div>
              <div className="text-[12.5px] text-lms-sub">Giáo viên Tiểu học</div>
            </div>
          </div>
          <p className="m-0 text-[13.5px] leading-relaxed text-lms-sub">
            “Mình tin học liệu tốt nên đến được với mọi người. Tất cả ở đây đều miễn phí.”
          </p>
          <div className="mt-auto flex gap-2">
            <span className="rounded-[20px] bg-lms-accent-soft px-2.5 py-1 text-[11.5px] text-lms-sub">10+ năm dạy Tiểu học</span>
            <span className="rounded-[20px] bg-lms-accent-soft px-2.5 py-1 text-[11.5px] text-lms-sub">Chia sẻ mở</span>
          </div>
        </div>
        <div className="col-4 reveal bento-tile hovlift grid grid-cols-2 gap-3.5 border border-lms-line bg-lms-surface p-[22px]">
          {[[DB.DOCS.length + '+', 'học liệu', 'book'], [DB.STUDENT_TASKS.length + '+', 'bài tập', 'assign'], [DB.ARTICLES.length + '', 'bài viết', 'docs'], ['100%', 'miễn phí', 'flame']].map(([v, l, ic], i) => (
            <div key={i} className="flex flex-col gap-1">
              <Icon name={ic} size={17} stroke={p.accent} />
              <div className="mt-1 font-lms-heading text-[22px] font-extrabold tracking-[-0.5px] text-lms-ink">{v}</div>
              <div className="text-[11.5px] text-lms-faint">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bento mb-10">
        {heroDoc && (
        <div
          className="col-5 reveal bento-tile hovlift flex cursor-pointer flex-col overflow-hidden border border-lms-line bg-lms-surface"
          onClick={() => go('s-doc', { doc: heroDoc.id })}
        >
          <div className="flex h-[120px] items-end bg-[image:var(--lms-feature-gradient)] p-4">
            <Tag p={p} color="#fff" soft={false} className="border border-white/50 text-white">HỌC LIỆU NỔI BẬT</Tag>
          </div>
          <div className="p-5">
            <div className="font-lms-heading text-lg font-bold leading-snug text-lms-ink">{heroDoc.name}</div>
            <div className="mt-2 text-[12.5px] text-lms-faint">{heroDoc.folder} · {heroDoc.size}</div>
          </div>
        </div>
        )}

        {exercise && (
        <div
          className="col-4 reveal bento-tile hovlift flex cursor-pointer flex-col border border-lms-line bg-[image:var(--lms-card-gradient)] p-6"
          onClick={() => go('s-task', { task: exercise.id })}
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-lms-line bg-lms-surface">
            <Icon name="assign" size={21} stroke={p.accent} />
          </div>
          <div className="mb-1.5 text-xs font-bold tracking-[0.3px] text-lms-accent">LUYỆN TẬP</div>
          <div className="font-lms-heading text-[19px] font-bold leading-snug text-lms-ink">{exercise.title}</div>
          <div className="mt-2 text-[12.5px] text-lms-sub">{exercise.type} · {exercise.questions} câu{exercise.learners ? ' · ' + exercise.learners + ' người làm' : ''}</div>
          <div className="mt-auto pt-4"><Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Làm thử ngay</Btn></div>
        </div>
        )}

        {lead && (
        <div
          className="col-3 reveal bento-tile hovlift flex cursor-pointer flex-col border border-lms-line bg-lms-surface p-[22px]"
          onClick={() => go('article', { article: lead.id })}
        >
          <div className="mb-2.5 text-xs font-bold tracking-[0.3px] text-lms-accent">BÀI VIẾT MỚI</div>
          <div className="font-lms-heading text-[17px] font-bold leading-snug text-lms-ink">{lead.title}</div>
          <p className="mt-2.5 mb-0 text-[12.5px] leading-snug text-lms-sub">{lead.excerpt}</p>
          <div className="mt-auto pt-3.5 text-xs text-lms-faint">{lead.read} đọc →</div>
        </div>
        )}

        {!heroDoc && !exercise && !lead && (
        <div className="col-12 reveal bento-tile flex items-center justify-center border border-lms-line bg-lms-surface py-8">
          <Empty description="Chưa có nội dung nổi bật" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
        )}
      </div>

      <HomeSection
        title="Khám phá theo chủ đề"
        linkLabel="Tất cả →"
        onLink={() => setRoute('s-docs')}
        empty={cats.length === 0}
        emptyDescription="Chưa có chủ đề"
        contentClassName="mb-10"
      >
        <div className="reveal mb-10 grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {cats.map((c, i) => (
            <div key={c} onClick={() => setRoute('s-docs')} className="bento-tile hovlift cursor-pointer border border-lms-line bg-lms-surface p-[18px]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent-soft">
                <Icon name={catIcons[i % catIcons.length]} size={19} stroke={p.accent} />
              </div>
              <div className="text-sm font-semibold text-lms-ink">{c}</div>
              <div className="mt-[3px] text-[11.5px] text-lms-faint">{DB.DOCS.filter((d) => d.folder === c).length} học liệu</div>
            </div>
          ))}
        </div>
      </HomeSection>

      <HomeSection
        title="Học liệu nổi bật"
        linkLabel="Xem thêm →"
        onLink={() => setRoute('s-docs')}
        empty={featured.length === 0}
        emptyDescription="Chưa có học liệu"
        contentClassName="mb-11"
      >
        <div className="reveal mb-11 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
          {featured.map((d) => {
            const m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift cursor-pointer overflow-hidden border border-lms-line bg-lms-surface">
                <div className="relative flex h-[92px] items-center justify-center bg-lms-accent-soft">
                  <Icon name={m.icon} size={28} stroke={p.accent} sw={1.4} />
                  <span className="absolute top-2.5 left-2.5"><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                </div>
                <div className="p-4">
                  <div className="min-h-9 text-[13.5px] font-semibold leading-snug text-lms-ink">{d.name}</div>
                  <div className="mt-2.5 font-mono text-[11px] text-lms-faint">{d.folder} · {d.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      </HomeSection>

      <HomeSection
        title="Bài viết mới nhất"
        linkLabel="Tất cả bài viết →"
        onLink={() => setRoute('blog')}
        empty={latestArticles.length === 0}
        emptyDescription="Chưa có bài viết"
        contentClassName="pb-2"
      >
        <div className="reveal grid gap-4 pb-2 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {latestArticles.map((a) => (
            <div key={a.id} onClick={() => go('article', { article: a.id })} className="bento-tile hovlift cursor-pointer border border-lms-line bg-lms-surface p-5">
              <span className="mb-2.5 inline-block rounded-md bg-lms-accent-soft px-[9px] py-[3px] text-[11px] font-bold text-lms-accent">{a.cat}</span>
              <h3 className="m-0 font-lms-heading text-[17px] font-bold leading-snug text-lms-ink">{a.title}</h3>
              <p className="my-2 text-[13px] leading-snug text-lms-sub">{a.excerpt}</p>
              <div className="text-[11.5px] text-lms-faint">{a.author} · {a.read} đọc</div>
            </div>
          ))}
        </div>
      </HomeSection>
    </div>
  );
}

export function SOverview({ p, t, setRoute, go }) {
  const auth = useLmsAuth();
  const todo = DB.STUDENT_TASKS.filter((x) => x.status === 'todo');
  const graded = DB.STUDENT_TASKS.filter((x) => x.status === 'graded' || (x.status === 'done' && x.score));
  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-[30px] pb-10">
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-2.5 font-mono text-[11.5px] tracking-[1px] text-lms-faint">THỨ HAI · 22 THÁNG 6, 2026</div>
          <h2 className="m-0 font-lms-heading text-4xl font-medium leading-[1.05] tracking-[-0.6px] text-lms-ink">
            Chào bạn, <span className="text-lms-accent">{auth.name || 'bạn'}.</span>
          </h2>
          <p className="mt-3 mb-0 max-w-[480px] text-[14.5px] leading-normal text-lms-sub">
            Bạn có <strong className="text-lms-ink">3 bài tập</strong> cần hoàn thành, trong đó <strong className="text-lms-ink">1 bài đến hạn hôm nay</strong>.
          </p>
        </div>
        <div className={`${cardClass(20)} flex items-center gap-4`}>
          <Ring value={84} size={64} thickness={7} p={p} color={p.accent} label="8,4" />
          <div><div className="text-[13px] text-lms-sub">Điểm trung bình</div>
            <div className="mt-0.5 font-lms-heading text-base font-semibold text-lms-ink">Xếp hạng 3/28</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] min-[961px]:grid-cols-[1.5fr_1fr]">
        <section className={cardClass(20)}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 font-lms-heading text-xl font-medium text-lms-ink">Bài cần làm</h3>
            <span onClick={() => setRoute('s-tasks')} className="cursor-pointer font-mono text-[11.5px] text-lms-accent">Tất cả →</span>
          </div>
          {todo.map((task, i) => (
            <div key={task.id} onClick={() => go('s-task', { task: task.id })} className={`lms-row flex cursor-pointer items-center gap-3.5 py-3.5 ${i ? 'border-t border-lms-line' : ''}`}>
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-lms-accent-soft">
                <Icon name="assign" size={20} stroke={p.accent} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-lms-ink">{task.title}</div>
                <div className="mt-0.5 text-xs text-lms-faint">{task.type} · {task.questions} câu{task.learners ? ' · ' + task.learners + ' người làm' : ''}</div>
              </div>
              <Tag p={p} color={task.dueIn === 'Hôm nay' ? p.danger : p.sub}>{task.dueIn}</Tag>
              <Btn p={p} variant="soft" size="sm">Làm bài</Btn>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-[22px]">
          <section className="rounded-xl border border-lms-line bg-[image:var(--lms-card-gradient)] p-[22px]">
            <Icon name="book" size={22} stroke={p.accent} />
            <h3 className="my-3 mb-1.5 font-lms-heading text-[19px] font-semibold text-lms-ink">Kho tài liệu</h3>
            <p className="mb-4 mt-0 text-[13px] leading-normal text-lms-sub">Tìm tài liệu, đề thi, sơ đồ tư duy để đọc và ôn tập.</p>
            <Btn p={p} icon="search" full onClick={() => setRoute('s-docs')}>Khám phá học liệu</Btn>
          </section>
          <section className={cardClass(20)}>
            <h3 className="mb-4 mt-0 font-lms-heading text-xl font-medium text-lms-ink">Kết quả gần đây</h3>
            {graded.map((g, i) => (
              <div key={g.id} className={`flex items-center gap-3 py-[11px] ${i ? 'border-t border-lms-line' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-lms-ink">{g.title}</div>
                  <div className="mt-0.5 text-[11px] text-lms-faint">{g.type} · {g.questions} câu</div>
                </div>
                <span className={`font-lms-heading text-xl font-semibold ${g.score >= 8 ? 'text-lms-ok' : 'text-lms-ink'}`}>{g.score}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function STaskRow({ task, p, go }) {
  const tone = taskTone(p, task.status);
  return (
    <div className={`lms-card flex items-center gap-4 rounded-xl border border-lms-line bg-lms-surface px-5 py-4 ${task.status === 'todo' ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={() => task.status === 'todo' && go('s-task', { task: task.id })}>
      <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${taskIconBg(task.status)}`}>
        <Icon name={task.status === 'graded' ? 'checkCircle' : 'assign'} size={20} stroke={tone} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-lms-ink">{task.title}</div>
        <div className="mt-1 text-xs text-lms-sub">{[task.class || task.subject, task.type, task.due && `hạn ${task.due}`].filter(Boolean).join(' · ')}</div>
      </div>
      {task.score != null
        ? <div className="text-center"><div className="font-lms-heading text-[22px] font-semibold text-lms-ok">{task.score}</div><div className="text-[10px] text-lms-faint">/{task.points}</div></div>
        : <Tag p={p} color={tone}>{task.dueIn}</Tag>}
      {task.status === 'todo' ? <Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Làm bài</Btn> : <Tag p={p} color={taskTone(p, task.status)}>{taskLabel(task.status)}</Tag>}
    </div>
  );
}

export function STasks({ p, t, go }) {
  useLMS();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const f = parseTaskTab(searchParams.get('activeTab'));

  const setTab = React.useCallback((tab: TaskTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'todo') params.delete('activeTab');
    else params.set('activeTab', tab);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const list = DB.STUDENT_TASKS.filter((x) => f === 'all' ? true : f === 'done' ? x.status !== 'todo' : x.status === 'todo');
  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex gap-2">
        <Pill p={p} active={f === 'todo'} onClick={() => setTab('todo')}>Cần làm</Pill>
        <Pill p={p} active={f === 'done'} onClick={() => setTab('done')}>Đã nộp & chấm</Pill>
        <Pill p={p} active={f === 'all'} onClick={() => setTab('all')}>Tất cả</Pill>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-lms-line bg-lms-surface py-10">
          <Empty
            description={DB.STUDENT_TASKS.length === 0 ? 'Chưa có bài tập' : 'Không có bài tập trong mục này'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((task) => <STaskRow key={task.id} task={task} p={p} go={go} />)}
        </div>
      )}
    </div>
  );
}

// Map a populated API question (base row + per-type `questionDetail`) into the
// shape QuestionView/levelMeta expect: { id, type, level, stem, options, answer, pairs }.
// Mirrors the conventions in lib/sync/load-questions.ts. Returns null when the
// base question is missing so callers can filter it out.
function mapApiQuestion(link: any): any {
  const q = link?.question;
  if (!q) return null;
  const detail = q.questionDetail || {};
  let options: string[] = [];
  let answer: any[] = [];
  let pairs: [string, string][] = [];
  try {
    if (q.type === 'single') {
      options = detail.options ?? [];
      answer = detail.correctOptionIndex != null ? [detail.correctOptionIndex] : [];
    } else if (q.type === 'multi') {
      options = detail.options ?? [];
      answer = detail.correctOptionIndices ?? [];
    } else if (q.type === 'truefalse') {
      answer = detail.isCorrect ? [0] : [1];
    } else if (q.type === 'fill') {
      answer = detail.answers ?? [];
    } else if (q.type === 'match') {
      pairs = (detail.pairs ?? []).map((pr: any) => [pr.left, pr.right] as [string, string]);
    }
  } catch { /* leave defaults — never crash the player on an odd detail shape */ }
  return {
    id: q._id,
    questionId: q._id,
    type: q.type,
    level: q.level,
    stem: q.content ?? q.title ?? '',
    options,
    answer,
    pairs,
  };
}

// Turn the QuestionView "do"-mode answer ({ choices } | { text }) into the
// attempts submit payload entry, scoring choice/fill types client-side against
// the mapped `answer` (essay/match left for teacher grading).
function buildSubmitAnswer(q: any, raw: any): any {
  const out: any = { questionId: q.questionId || q.id };
  if (q.type === 'single' || q.type === 'multi' || q.type === 'truefalse') {
    const choices = (raw && raw.choices) || [];
    out.answer = choices;
    const correct = q.answer || [];
    out.isCorrect = choices.length === correct.length && correct.every((c: any) => choices.includes(c));
  } else if (q.type === 'fill') {
    const text = (raw && raw.text) || '';
    out.answer = text;
    const ok = (q.answer || []).map((s: any) => String(s).trim().toLowerCase());
    out.isCorrect = ok.length > 0 && ok.includes(String(text).trim().toLowerCase());
  } else {
    // essay / match / other → submit the raw answer, leave grading to the teacher.
    out.answer = raw && raw.text != null ? raw.text : raw;
  }
  return out;
}

export function STask({ p, t, ctx, setRoute, auth }) {
  const task = DB.STUDENT_TASKS.find((x) => x.id === ctx.task) || DB.STUDENT_TASKS[0];
  const [liveQs, setLiveQs] = React.useState(null);
  const [exType, setExType] = React.useState(null);
  const [cur, setCur] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [ws, setWs] = React.useState(null);

  // Live questions: GET /exercises/:id and map the polymorphic details. Best-effort —
  // on 404/down/logged-out we fall back to the mock bank so the player still renders.
  React.useEffect(() => {
    if (!task) return;
    let alive = true;
    setLiveQs(null); setExType(null); setCur(0); setAnswers({}); setResult(null);
    (async () => {
      try {
        const ex = await exercisesApi.get(task.id);
        if (!alive || !ex) return;
        const mapped = (ex.questions || []).map(mapApiQuestion).filter(Boolean);
        setExType(ex.type ?? null);
        if (mapped.length) setLiveQs(mapped);
      } catch { /* keep null → mock fallback below */ }
    })();
    return () => { alive = false; };
  }, [task?.id]);

  // Chưa đăng nhập → tự bật LoginModal (không hiện trang gate riêng).
  React.useEffect(() => { if (auth && !auth.loggedIn) auth.open(); }, [auth?.loggedIn]);

  if (auth && !auth.loggedIn) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3.5 p-[30px] text-center">
        <p className="m-0 max-w-[420px] text-[14.5px] leading-relaxed text-lms-sub">Cần đăng nhập để làm bài tập.</p>
        <div className="flex gap-2.5">
          <Btn p={p} icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" onClick={() => setRoute('s-tasks')}>Quay lại</Btn>
        </div>
      </div>
    );
  }
  if (!task) return null;

  const mockEssay = task.type === 'Tự luận';
  const mockQs = mockEssay
    ? [DB.QUESTIONS.find((q) => q.id === 'q5')]
    : DB.QUESTIONS.filter((q) => ['q1', 'q2', 'q3', 'q6'].includes(q.id));

  const essay = exType ? exType === 'essay' : mockEssay;
  const qs = (liveQs && liveQs.length ? liveQs : mockQs).filter(Boolean);
  const cur2 = Math.min(cur, Math.max(0, qs.length - 1));
  const q = qs[cur2];
  const answered = Object.keys(answers).length;

  // start → submit → result against the attempt API. Best-effort: any failure
  // (logged-out, offline, no questions) falls back to the mock submit + exit.
  async function submitNow() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!liveQs || !liveQs.length) throw new Error('no-live-questions');
      const attempt = await attemptsApi.start(task.id);
      const attemptId = attempt?._id;
      if (!attemptId) throw new Error('no-attempt');
      const payload = liveQs.map((qq) => buildSubmitAnswer(qq, answers[qq.id]));
      await attemptsApi.submit(attemptId, payload);
      let res: any = null;
      try { res = await attemptsApi.result(attemptId); } catch { /* result optional */ }
      const sub = res?.submission;
      const correct = liveQs.reduce((n, qq) => {
        const a = buildSubmitAnswer(qq, answers[qq.id]);
        return n + (a.isCorrect ? 1 : 0);
      }, 0);
      const score = typeof sub?.totalScore === 'number'
        ? sub.totalScore
        : typeof sub?.totalGrades === 'number'
        ? sub.totalGrades
        : null;
      setResult({
        score,
        correct,
        total: liveQs.length,
        percent: typeof sub?.percent === 'number' ? sub.percent : null,
        graded: !!sub?.isGraded,
        waiting: sub?.waitingGrades ?? sub?.numberOfEssays ?? 0,
      });
      try { await hydrateFor('s-task'); } catch { /* refresh DB best-effort */ }
    } catch {
      const txt = essay ? ((answers[q?.id] && answers[q.id].text) || '') : '';
      LMS && LMS.submitAssignment(task.id, {
        text: essay ? (txt || 'Bài tự luận đã nộp.') : 'Học viên đã hoàn thành bài trắc nghiệm.',
        wordcount: txt ? txt.length : 0,
      });
      setRoute('s-tasks');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const pct = result.percent != null
      ? result.percent
      : (result.total ? Math.round((result.correct / result.total) * 100) : 0);
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-[30px] text-center">
        <div className="mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-lms-accent-soft">
          <Icon name={result.graded ? 'checkCircle' : 'send'} size={32} stroke={p.accent} />
        </div>
        <h2 className="m-0 font-lms-heading text-[28px] font-extrabold tracking-[-0.5px] text-lms-ink">Đã nộp bài!</h2>
        <p className="my-2.5 mb-[22px] max-w-[420px] text-[14.5px] leading-relaxed text-lms-sub">
          {result.graded
            ? 'Bài của bạn đã được chấm.'
            : result.waiting
            ? 'Bài đã nộp. Phần tự luận đang chờ giáo viên chấm.'
            : 'Bài của bạn đã được ghi nhận.'}
        </p>
        <div className="mb-[26px] flex gap-[22px]">
          <div className={`${cardClass(20)} min-w-[120px] p-[18px]`}>
            <div className={`font-lms-heading text-[30px] font-extrabold ${result.score != null && result.score >= (task.points || 10) * 0.8 ? 'text-lms-ok' : 'text-lms-ink'}`}>
              {result.score != null ? result.score : `${result.correct}/${result.total}`}
            </div>
            <div className="mt-1 text-xs text-lms-faint">{result.score != null ? `điểm / ${task.points}` : 'câu đúng'}</div>
          </div>
          <div className={`${cardClass(20)} flex min-w-[120px] flex-col items-center justify-center gap-2 p-[18px]`}>
            <Ring value={pct} size={56} thickness={6} p={p} color={p.accent} label={`${pct}%`} />
            <div className="text-xs text-lms-faint">tỉ lệ đúng</div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Btn p={p} size="lg" icon="arrowLeft" onClick={() => setRoute('s-tasks')}>Về danh sách bài</Btn>
        </div>
      </div>
    );
  }
  const worksheets = [
    { id: 'ws1', name: 'Phiếu học tập — Đọc hiểu “Dế Mèn bênh vực kẻ yếu”' },
    { id: 'ws2', name: 'Phiếu luyện viết đoạn văn tả con vật' },
  ];

  if (!q) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-[30px] text-center">
        <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-lms-accent-soft">
          <Icon name="assign" size={28} stroke={p.accent} />
        </div>
        <h2 className="m-0 font-lms-heading text-2xl font-extrabold text-lms-ink">Bài tập chưa có câu hỏi</h2>
        <p className="my-2.5 mb-[22px] max-w-[400px] text-sm leading-relaxed text-lms-sub">Bài này hiện chưa có câu hỏi nào để làm. Hãy quay lại sau nhé.</p>
        <Btn p={p} icon="arrowLeft" onClick={() => setRoute('s-tasks')}>Về danh sách bài</Btn>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-lms-line px-[30px] py-4">
        <div onClick={() => setRoute('s-tasks')} className="lms-link inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
          <Icon name="x" size={16} stroke={p.sub} /> Thoát
        </div>
        <div className="h-[26px] w-px bg-lms-line" />
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-lms-ink">{task.title}</div>
          <div className="text-xs text-lms-faint">{task.type} · {task.points} điểm</div>
        </div>
        <div className="flex items-center gap-2 rounded-[10px] border border-lms-line bg-lms-surface px-[13px] py-[7px]">
          <Icon name="clock" size={15} stroke={p.warn} /><span className="font-mono text-[13px] text-lms-ink">28:14</span>
        </div>
      </div>

      <div className="lms-scroll flex-1 overflow-y-auto p-[30px]">
        <div className="mx-auto max-w-[680px]">
          <div className={`${cardClass(16)} mb-5`}>
            <div className={`flex items-center gap-2.5 ${ws ? 'mb-3.5' : ''}`}>
              <Icon name="docs" size={17} stroke={p.accent} />
              <span className="text-[13px] font-semibold text-lms-ink">Phiếu học tập</span>
              <div className="flex-1" />
              <div className="flex flex-wrap gap-2">
                {worksheets.map((w) => {
                  const active = ws && ws.id === w.id;
                  return (
                  <button key={w.id} onClick={() => setWs(ws && ws.id === w.id ? null : w)} className={`lms-btn inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 font-sans text-[12.5px] font-medium ${active ? 'border border-lms-accent bg-lms-accent-soft text-lms-accent' : 'border border-lms-line bg-lms-surface text-lms-sub'}`}>
                    <Icon name="eye" size={14} stroke={active ? p.accent : p.faint} /> {w.name}
                  </button>
                  );
                })}
              </div>
            </div>
            {ws && (
              <div className="rounded-lg border border-lms-line bg-lms-raise p-[18px]">
                <div className="mb-2.5 text-sm font-semibold text-lms-ink">{ws.name}</div>
                {DOC_BODY.slice(0, 3).map((para, i) => (
                  <p key={i} className="mb-2.5 mt-0 text-[13.5px] leading-[1.8] text-pretty text-lms-sub">{para}</p>
                ))}
                <Btn p={p} variant="ghost" size="sm" icon="download">Tải phiếu</Btn>
              </div>
            )}
          </div>
          {!essay && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {qs.map((_, i) => (
                <button key={i} onClick={() => setCur(i)} className={`h-[38px] w-[38px] cursor-pointer rounded-[10px] font-mono text-[13px] font-semibold ${
                  i === cur2 ? 'border border-lms-accent bg-lms-accent-soft text-lms-accent'
                    : answers[qs[i].id] ? 'border border-lms-ok bg-lms-ok/8 text-lms-ok'
                    : 'border border-lms-line bg-lms-surface text-lms-sub'}`}>{i + 1}</button>
              ))}
            </div>
          )}
          <div className={`${cardClass(20)} p-7`}>
            <div className="mb-3.5 flex items-center gap-2">
              <Tag p={p} color={p.accent}>{essay ? 'Tự luận' : `Câu ${cur2 + 1}/${qs.length}`}</Tag>
              <Tag p={p} color={levelMeta(q.level).color}>{levelMeta(q.level).label}</Tag>
            </div>
            <div className="mb-[22px] text-lg font-medium leading-normal text-lms-ink">{q.stem}</div>
            <QuestionView q={q} p={p} mode="do" answer={answers[q.id]} onAnswer={(v) => setAnswers({ ...answers, [q.id]: v })} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            {!essay && <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => setCur(Math.max(0, cur2 - 1))}>Câu trước</Btn>}
            <div className="flex-1 text-center font-mono text-[12.5px] text-lms-faint">
              {essay ? `${(answers[q.id] && answers[q.id].text || '').length} ký tự` : `Đã trả lời ${answered}/${qs.length}`}
            </div>
            {!essay && cur2 < qs.length - 1
              ? <Btn p={p} iconRight="arrowRight" onClick={() => setCur(cur2 + 1)}>Câu sau</Btn>
              : <Btn p={p} variant="accent" icon="send" onClick={submitNow}>{submitting ? 'Đang nộp…' : 'Nộp bài'}</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function SDocs({ p, t, go }) {
  useLMS();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = React.useState('');
  const rawTab = searchParams.get('activeTab');
  const folder = !rawTab || !DB.DOC_FOLDERS.includes(rawTab) ? 'Tất cả' : rawTab;

  const setFolder = React.useCallback((f: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (f === 'Tất cả') params.delete('activeTab');
    else params.set('activeTab', f);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const list = DB.DOCS.filter((d) => (folder === 'Tất cả' || d.folder === folder)
    && (!q || (d.name + ' ' + d.folder).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="reveal mb-[22px] rounded-[18px] border border-lms-line bg-[image:var(--lms-hero-gradient)] px-[30px] py-[34px]">
        <h2 className="m-0 font-lms-heading text-[26px] font-bold tracking-[-0.4px] text-lms-ink">
          Kho tài liệu <span className="text-lms-accent">Ngữ văn</span>
        </h2>
        <p className="mt-2 mb-[18px] max-w-[520px] text-sm leading-normal text-lms-sub">
          Tìm tài liệu, đề thi, sơ đồ tư duy và bài giảng để đọc, ôn tập và làm bài.
        </p>
        <div className="max-w-[560px]">
          <Field p={p} icon="search" value={q} onChange={setQ} placeholder="Tìm theo tên tài liệu, chủ đề…" className="h-[46px]" />
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {DB.DOC_FOLDERS.map((f) => {
          const n = f === 'Tất cả' ? DB.DOCS.length : DB.DOCS.filter((d) => d.folder === f).length;
          return <Pill key={f} p={p} active={f === folder} onClick={() => setFolder(f)}>{f}{f !== 'Tất cả' ? ` · ${n}` : ` · ${n}`}</Pill>;
        })}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-lms-line bg-lms-surface py-10">
          <Empty
            description={
              DB.DOCS.length === 0
                ? 'Chưa có học liệu'
                : 'Không tìm thấy học liệu — thử từ khóa hoặc chủ đề khác'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="reveal grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {list.map((d) => {
            const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift cursor-pointer overflow-hidden border border-lms-line bg-lms-surface">
                <div className="relative flex h-24 items-center justify-center overflow-hidden bg-lms-accent-soft">
                  <Icon name={m.icon} size={30} stroke={p.accent} sw={1.4} />
                  {d.thumb && <img src={d.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
                  <span className={`absolute top-2.5 left-2.5 z-[2] rounded-[7px] ${d.thumb ? 'bg-white/92 shadow-sm backdrop-blur-sm' : ''}`}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                  <span className={`absolute top-2.5 right-2.5 z-[2] rounded-[7px] ${d.thumb ? 'bg-white/92 shadow-sm backdrop-blur-sm' : ''}`}><Tag p={p} color={p.sub}>{d.folder}</Tag></span>
                </div>
                <div className="p-3.5">
                  <div className="min-h-9 text-[13.5px] font-semibold leading-snug text-lms-ink">{d.name}</div>
                  {d.desc && <div className="mt-1.5 max-h-[34px] overflow-hidden text-[11.5px] leading-snug text-lms-sub">{stripHtml(d.desc).slice(0, 110)}</div>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-lms-faint">👁 {d.views ?? 0} · ↓ {d.downloads}</span>
                    <Btn p={p} variant="soft" size="sm" iconRight="arrowRight" onClick={() => go && go('s-doc', { doc: d.id })}>Đọc</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DOC_BODY = [
  'Tài liệu này tổng hợp những nội dung trọng tâm, được biên soạn bám sát chương trình Tiếng Việt Tiểu học hiện hành.',
  'Phần đầu giới thiệu khái quát bài học, kèm sơ đồ hệ thống ý đơn giản, nhiều màu sắc để các em dễ ghi nhớ.',
  'Phần thân hướng dẫn từng bước, có ví dụ minh hoạ gần gũi và gợi ý cách viết đoạn văn theo cấu trúc mở — thân — kết.',
  'Cuối tài liệu là bộ câu hỏi tự luyện kèm đáp án, giúp các em tự kiểm tra mức độ nắm bài trước khi làm bài tập trên hệ thống.',
];
function MediaBlock({ d, p, m }) {
  const [url, setUrl] = React.useState(null);
  const [name, setName] = React.useState('');
  const inputRef = React.useRef(null);
  const isVideo = d.type === 'video', isAudio = d.type === 'audio';
  const onPick = (e) => { const f = e.target.files && e.target.files[0]; if (f) { setUrl(URL.createObjectURL(f)); setName(f.name); } };
  if (!isVideo && !isAudio) {
    return (
      <div className="mb-6 flex h-[200px] items-center justify-center rounded-[10px] bg-lms-accent-soft">
        <Icon name={m.icon} size={56} stroke={p.accent} sw={1.2} />
      </div>
    );
  }
  return (
    <div className="mb-6">
      {url ? (
        isVideo
          ? <video src={url} controls className="max-h-[380px] w-full rounded-[10px] bg-black" />
          : <div className="rounded-[10px] bg-lms-accent-soft p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Icon name="play" size={18} stroke={p.accent} /><span className="text-[13px] font-semibold text-lms-ink">{name}</span></div>
              <audio src={url} controls className="w-full" />
            </div>
      ) : (
        <div onClick={() => inputRef.current && inputRef.current.click()} className="lms-row flex h-[200px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-lms-line bg-lms-raise">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-lms-accent-soft">
            <Icon name={isVideo ? 'video' : 'play'} size={24} stroke={p.accent} /></div>
          <div className="text-sm font-semibold text-lms-ink">{isVideo ? 'Tải video lên để xem trực tiếp' : 'Tải audio lên để nghe trực tiếp'}</div>
          <div className="text-xs text-lms-faint">Bấm để chọn tệp {isVideo ? 'video' : 'âm thanh'} từ máy của bạn</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={isVideo ? 'video/*' : 'audio/*'} onChange={onPick} className="hidden" />
      {url && <div className="mt-2.5"><Btn p={p} variant="ghost" size="sm" icon="upload" onClick={() => inputRef.current && inputRef.current.click()}>Đổi tệp khác</Btn></div>}
    </div>
  );
}
export function SDocReader({ p, t, ctx, setRoute, go }) {
  const d = DB.DOCS.find((x) => x.id === ctx.doc) || DB.DOCS[0];
  if (!d) return <EmptyState p={p} icon="book" label="Không có tài liệu" sub="Chưa có nội dung." action={<Btn p={p} variant="soft" size="sm" icon="arrowLeft" onClick={() => setRoute('s-docs')} className="mt-1">Về kho tài liệu</Btn>} />;
  const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
  const related = DB.DOCS.filter((x) => x.folder === d.folder && x.id !== d.id).slice(0, 4);
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
      <div onClick={() => setRoute('s-docs')} className="lms-link mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Kho tài liệu
      </div>
      <div className="mb-[22px] flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-lms-accent-soft">
          <Icon name={m.icon} size={26} stroke={p.accent} /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex gap-2"><Tag p={p} color={p.accent}>{m.label}</Tag><Tag p={p} color={p.sub}>{d.folder}</Tag></div>
          <h2 className="m-0 font-lms-heading text-2xl font-bold leading-tight tracking-[-0.3px] text-lms-ink">{d.name}</h2>
          <div className="mt-1.5 text-[12.5px] text-lms-faint">{d.by} · cập nhật {d.updated} · {d.size} · ↓ {d.downloads} lượt tải</div>
        </div>
        {(DB.DOWNLOADS || []).includes(d.id)
          ? <Btn p={p} variant="soft" icon="check">Đã tải</Btn>
          : <Btn p={p} icon="download" onClick={async () => {
              try {
                await filesApi.download(d.id);
                if (d.url) window.open(d.url, '_blank');
                await hydrateFor('s-doc');
              } catch {
                LMS && LMS.download(d.id); // logged-out (401) / API down → mock fallback
              }
            }}>Tải về</Btn>}
      </div>

      {(() => {
        const preview = d.url ? d.url.replace(/\/view.*$/, '/preview') : '';
        return preview ? (
          <div className={`${cardClass(20)} mb-[18px] overflow-hidden p-0`}>
            <iframe src={preview} title={d.name} className="block h-[600px] w-full border-0 bg-lms-raise" allow="autoplay" />
          </div>
        ) : (
          <div className={`${cardClass(30)} mb-[18px]`}><MediaBlock d={d} p={p} m={m} /></div>
        );
      })()}
      <div className={`${cardClass(30)} mb-[22px]`}>
        {d.desc
          ? <div className="lms-rich text-[15.5px] leading-[1.9] text-lms-ink" dangerouslySetInnerHTML={{ __html: d.desc }} />
          : <p className="m-0 text-[15.5px] leading-[1.9] text-lms-sub">Tài liệu được chia sẻ từ kho học liệu Ngữ văn. Bấm “Mở trên Google Drive” để xem bản đầy đủ.</p>}
        <div className="mt-[18px] flex flex-wrap gap-2.5">
          <Btn p={p} variant="soft" icon="assign" onClick={() => setRoute('s-tasks')}>Làm bài tập liên quan</Btn>
          <Btn p={p} variant="ghost" icon="rubric" onClick={() => setRoute('s-selfcheck')}>Tự đánh giá</Btn>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h3 className="mb-3.5 mt-0 font-lms-heading text-lg font-semibold text-lms-ink">Học liệu liên quan</h3>
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {related.map((r) => {
              const rm = DOC_TYPE_META[r.type] || DOC_TYPE_META.doc;
              return (
                <div key={r.id} onClick={() => go('s-doc', { doc: r.id })} className={`lms-card lms-row ${cardClass(20)} flex cursor-pointer items-center gap-3 p-3.5`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lms-accent-soft">
                    <Icon name={rm.icon} size={18} stroke={p.accent} /></div>
                  <div className="min-w-0"><div className="text-[13px] font-semibold leading-snug text-lms-ink">{r.name}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-lms-faint">{rm.label}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SSelfCheck({ p, t }) {
  const works = [
    { id: 'w1', title: 'Tập làm văn — Tả con vật nuôi em yêu thích', rubric: 'r1' },
    { id: 'w2', title: 'Kể chuyện — Một việc tốt em đã làm', rubric: 'r2' },
  ];
  const [workId, setWorkId] = React.useState('w1');
  const work = works.find((w) => w.id === workId) || works[0];
  const rubric = DB.RUBRICS.find((r) => r.id === work.rubric) || DB.RUBRICS[0];
  const [sel, setSel] = React.useState({});
  const [note, setNote] = React.useState('');
  const [savingSelf, setSavingSelf] = React.useState(false);
  const [savedSelf, setSavedSelf] = React.useState(false);
  const selfScore = React.useMemo(() => {
    if (!rubric) return null;
    let sum = 0, any = false;
    rubric.criteria.forEach((c, ci) => { if (sel[ci] != null) { any = true; sum += c.weight * rubric.scale[sel[ci]].pct / 100; } });
    return any ? Math.round((sum / 10) * 10) / 10 : null;
  }, [sel, rubric]);
  React.useEffect(() => { setSel({}); setNote(''); setSavedSelf(false); }, [workId]);

  async function saveSelf() {
    if (savingSelf || !rubric) return;
    setSavingSelf(true);
    try {
      await selfAssessmentsApi.create({
        rubricId: rubric.id,
        source: 'text',
        totalPercent: selfScore != null ? Math.round(selfScore * 10) : undefined,
        note,
        text: note,
      });
    } catch { /* best-effort: keep the local reflection even if the save fails */ }
    finally { setSavingSelf(false); setSavedSelf(true); }
  }

  if (!rubric) return <EmptyState p={p} icon="rubric" label="Chưa có tiêu chí đánh giá" sub="Chưa có rubric." />;

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className={`${cardClass(20)} mb-5 flex items-center gap-3 border-lms-accent/30 bg-lms-accent-soft p-[18px]`}>
        <Icon name="bulb" size={20} stroke={p.accent} />
        <div className="text-[13.5px] leading-normal text-lms-ink">
          Tự đánh giá giúp bạn nhìn lại bài làm theo từng tiêu chí trước khi nộp. Chọn mức phù hợp ở mỗi tiêu chí để xem điểm tự chấm.
        </div>
      </div>

      <div className="mb-[18px]">
        <label className={lblClass()}>CHỌN BÀI ĐỂ TỰ ĐÁNH GIÁ</label>
        <Select p={p} value={workId} onChange={setWorkId} className="mt-2 max-w-[460px]"
          options={works.map((w) => ({ value: w.id, label: w.title }))} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[961px]:grid-cols-[1.5fr_1fr]">
        <section className={cardClass(20)}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="m-0 font-lms-heading text-[17px] font-semibold text-lms-ink">{rubric.name}</h3>
            <Tag p={p} color={p.accent}>{Object.keys(sel).length}/{rubric.criteria.length} tiêu chí</Tag>
          </div>
          <div className="lms-scrollx">
            <RubricMatrix rubric={rubric} p={p} mode="grade" selected={sel} onSelect={(ci, si) => setSel({ ...sel, [ci]: si })} />
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <div className={`${cardClass(20)} flex items-center gap-4`}>
            <Ring value={selfScore ? (selfScore / 10) * 100 : 0} size={64} thickness={7} p={p} color={p.accent} label={selfScore != null ? selfScore.toFixed(1) : '—'} />
            <div>
              <div className="text-[12.5px] text-lms-sub">Điểm tự chấm (thang 10)</div>
              <div className="mt-0.5 font-lms-heading text-lg font-bold text-lms-ink">
                {selfScore == null ? 'Chưa đánh giá' : selfScore >= 8 ? 'Rất tốt' : selfScore >= 6.5 ? 'Khá' : 'Cần cải thiện'}
              </div>
            </div>
          </div>
          <div className={cardClass(20)}>
            <label className={lblClass()}>GHI CHÚ RÚT KINH NGHIỆM</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mình cần cải thiện điều gì cho lần sau…"
              className="mt-2 box-border min-h-24 w-full resize-y rounded-lg border border-lms-line bg-lms-surface p-3 font-sans text-[13.5px] leading-relaxed text-lms-ink outline-none" />
            <Btn p={p} icon="check" full className="mt-3" onClick={saveSelf}>
              {savingSelf ? 'Đang lưu…' : savedSelf ? 'Đã lưu ✓' : 'Lưu tự đánh giá'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SResults({ p, t }) {
  const rubric = DB.RUBRICS[0];
  const liveGraded = DB.SUBMISSIONS.filter((s) => s.studentId === 's1' && s.status === 'graded').map((s) => {
    const a = DB.ASSIGNMENTS.find((x) => x.id === s.assignmentId) || {};
    return { title: a.title || 'Bài tập', class: a.class || 'TV5A1', score: s.score, fb: s.feedback || 'Đã chấm.', rubric: !!a.rubric };
  });
  const graded = [...liveGraded,
    { title: 'Kiểm tra 15 phút — Chính tả & từ loại', class: 'TV5A1', score: 8.5, fb: 'Làm tốt, chú ý vài lỗi chính tả nhỏ.', rubric: false },
    { title: 'Trắc nghiệm — Đọc hiểu “Hạt gạo làng ta”', class: 'TV5A1', score: 9.0, fb: 'Xuất sắc!', rubric: false },
    { title: 'Tập làm văn — Kể về một việc tốt em đã làm', class: 'TV5A1', score: 7.8, fb: 'Ý hay, cần thêm chi tiết và cảm xúc cho bài sinh động hơn.', rubric: true },
  ];
  const [open, setOpen] = React.useState(2);
  return (
    <div className="mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-6 flex gap-4">
        <div className={`${cardClass(20)} flex flex-1 items-center gap-4 p-[22px]`}>
          <Ring value={84} size={62} thickness={7} p={p} color={p.accent} label="8,4" />
          <div><div className="text-[13px] text-lms-sub">Điểm trung bình</div><div className="font-lms-heading text-[22px] font-semibold text-lms-ink">Khá tốt</div></div>
        </div>
        <div className={`${cardClass(20)} flex-1 p-[22px]`}>
          <div className="mb-2.5 text-[12.5px] text-lms-sub">Tiến triển 6 bài gần nhất</div>
          <Spark data={[7, 7.5, 8, 7.8, 8.5, 9]} w={200} h={40} stroke={p.accent} fill={p.accentSoft} sw={2.2} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {graded.map((g, i) => (
          <div key={i} className={`${cardClass(20)} overflow-hidden p-0`}>
            <div onClick={() => setOpen(open === i ? -1 : i)} className="lms-row flex cursor-pointer items-center gap-4 px-5 py-4">
              <div className="flex-1"><div className="text-[14.5px] font-semibold text-lms-ink">{g.title}</div>
                <div className="mt-[3px] text-xs text-lms-faint">{g.class}{g.rubric ? ' · chấm theo rubric' : ''}</div></div>
              <span className={`font-lms-heading text-[26px] font-semibold ${g.score >= 8 ? 'text-lms-ok' : 'text-lms-ink'}`}>{g.score}</span>
              <Icon name={open === i ? 'chevronDown' : 'chevronRight'} size={18} stroke={p.faint} />
            </div>
            {open === i && (
              <div className="border-t border-lms-line px-5 pb-5">
                {g.rubric && rubric && <div className="my-4"><RubricMatrix rubric={rubric} p={p} mode="grade" selected={{ 0: 0, 1: 1, 2: 1, 3: 0 }} /></div>}
                <div className="mt-4 flex gap-3 rounded-xl border border-lms-line bg-lms-raise p-3.5">
                  <Avatar name="Cô Phương Thanh" p={p} size={36} accent />
                  <div><div className="mb-[3px] text-xs font-semibold text-lms-ink">Nhận xét của giáo viên</div>
                    <div className="text-[13px] leading-normal text-lms-sub">{g.fb}</div></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SLibrary({ p, t, setRoute, go, auth }) {
  // Chưa đăng nhập → tự bật LoginModal (không hiện trang gate riêng).
  React.useEffect(() => { if (auth && !auth.loggedIn) auth.open(); }, [auth?.loggedIn]);
  if (auth && !auth.loggedIn) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3.5 p-[30px] text-center">
        <p className="m-0 max-w-[440px] text-[14.5px] leading-relaxed text-lms-sub">Cần đăng nhập để xem “Của tôi”.</p>
        <div className="flex gap-2.5">
          <Btn p={p} icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" onClick={() => setRoute('s-docs')}>Khám phá học liệu</Btn>
        </div>
      </div>
    );
  }
  const name = (auth && auth.name) || 'bạn';
  const first = name.split(' ').slice(-1)[0];
  const downloaded = (DB.DOWNLOADS || []).map((id) => DB.DOCS.find((d) => d.id === id)).filter(Boolean);
  const tasks = DB.STUDENT_TASKS.filter((x) => x.status === 'done' || x.status === 'graded');
  const scored = tasks.filter((x) => x.score != null);
  const avg = scored.length ? (scored.reduce((s, x) => s + x.score, 0) / scored.length) : null;
  const stats = [
    [String(downloaded.length), 'tài liệu đã tải', 'download'],
    [String(tasks.length), 'bài đã làm', 'assign'],
    [avg != null ? avg.toFixed(1) : '—', 'điểm trung bình', 'award'],
  ];
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-7 pb-10">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={name} p={p} size={56} accent />
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-[1px] text-lms-faint">KHÔNG GIAN CỦA TÔI</div>
          <h2 className="m-0 font-lms-heading text-[30px] font-extrabold leading-none tracking-[-0.6px] text-lms-ink">
            Chào <span className="text-lms-accent">{first}</span>, đây là kho của bạn.
          </h2>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 min-[961px]:grid-cols-3">
        {stats.map(([v, l, ic], i) => (
          <div key={i} className={`${cardClass(20)} flex items-center gap-3.5`}>
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-lms-accent-soft">
              <Icon name={ic} size={21} stroke={p.accent} /></div>
            <div><div className="font-lms-heading text-[26px] font-extrabold leading-none tracking-[-0.5px] text-lms-ink">{v}</div>
              <div className="mt-1 text-[12.5px] text-lms-faint">{l}</div></div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="m-0 font-lms-heading text-[21px] font-extrabold tracking-[-0.4px] text-lms-ink">Tài liệu đã tải</h3>
        <span onClick={() => setRoute('s-docs')} className="cursor-pointer text-[13px] font-semibold text-lms-accent">Tải thêm →</span>
      </div>
      {downloaded.length === 0 ? (
        <EmptyState p={p} icon="download" label="Chưa có tài liệu nào" sub="Tải tài liệu từ kho học liệu để lưu lại ở đây." action={<Btn p={p} variant="soft" size="sm" icon="search" onClick={() => setRoute('s-docs')} className="mt-1">Khám phá học liệu</Btn>} />
      ) : (
        <div className="mb-[34px] grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {downloaded.map((d) => {
            const m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift cursor-pointer overflow-hidden border border-lms-line bg-lms-surface">
                <div className="relative flex h-[84px] items-center justify-center bg-lms-accent-soft">
                  <Icon name={m.icon} size={26} stroke={p.accent} sw={1.4} />
                  <span className="absolute top-2.5 left-2.5"><Tag p={p} color={p.ok}>Đã tải ✓</Tag></span>
                </div>
                <div className="p-3.5">
                  <div className="min-h-[34px] text-[13px] font-semibold leading-snug text-lms-ink">{d.name}</div>
                  <div className="mt-2.5 font-mono text-[11px] text-lms-faint">{d.folder} · {d.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-3.5 mt-1.5 flex items-baseline justify-between">
        <h3 className="m-0 font-lms-heading text-[21px] font-extrabold tracking-[-0.4px] text-lms-ink">Bài tập đã làm</h3>
        <span onClick={() => setRoute('s-tasks')} className="cursor-pointer text-[13px] font-semibold text-lms-accent">Tất cả →</span>
      </div>
      {tasks.length === 0 ? (
        <EmptyState p={p} icon="assign" label="Chưa làm bài nào" sub="Hãy thử một bài luyện tập để theo dõi tiến bộ của bạn." />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => <STaskRow key={task.id} task={task} p={p} go={go} />)}
        </div>
      )}
    </div>
  );
}
