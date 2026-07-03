'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Empty } from 'antd';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Ring, Spark, EmptyState } from '@/app/components/ui';
import { DB, LMS, useLMS } from '@/app/store/store';
import { filesApi, exercisesApi, attemptsApi, selfAssessmentsApi, settingsApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { cardClass, lblClass } from '@/app/helpers/shared';
import { useLmsAuth } from '@/app/contexts/AuthProvider';
import { DOC_TYPE_META, RubricMatrix } from '@/app/screens/resources';
import { DocCardMini } from '@/app/screens/teacher';
import { levelMeta, QuestionView, RichText } from '@/app/screens/bank';
import { Pagination } from '@/app/components/Pagination';
import { FilterSelect } from '@/app/components/FilterSelect';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapExercise, typeVi } from '@/app/lib/sync/load-exercises';
import { mapFile, loadDoc } from '@/app/lib/sync/load-library';
import { EX_TYPE_OPTS, EX_STATUS_OPTS } from '@/app/screens/assign';
import { ROUTES } from '@/app/configs/routes.config';
import { withKeyword } from '@/app/helpers/related-href';

function taskTone(p, s) { return { todo: p.accent, done: p.info, graded: p.ok }[s] || p.sub; }
function taskLabel(s) { return { todo: 'Cần làm', done: 'Đã nộp', graded: 'Đã chấm' }[s] || s; }
function taskIconBg(s: string) { return { todo: 'bg-lms-accent-soft', done: 'bg-lms-info/12', graded: 'bg-lms-ok/12' }[s] || 'bg-lms-accent-soft'; }

// Grading/display uses the global academic score scale (settings.academic.scoreScale),
// NOT exercise.points. Fall back to 10 when settings are unavailable.
const DEFAULT_SCORE_SCALE = 10;

const TASK_TABS = ['todo', 'done', 'all'] as const;
type TaskTab = (typeof TASK_TABS)[number];

function parseTaskTab(raw: string | null): TaskTab {
  return TASK_TABS.includes(raw as TaskTab) ? (raw as TaskTab) : 'todo';
}

function HomeSection({
  title,
  linkLabel,
  linkHref,
  empty,
  emptyDescription,
  contentClassName,
  children,
}: {
  title: string;
  linkLabel: string;
  linkHref: string;
  empty: boolean;
  emptyDescription: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="reveal mb-4 flex items-baseline justify-between">
        <h2 className="m-0 font-lms-heading text-2xl font-extrabold tracking-[-0.6px] text-lms-ink">{title}</h2>
        <Link href={linkHref} className="text-[13px] font-semibold text-lms-accent no-underline">{linkLabel}</Link>
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

export function UserHome({ p, t }) {
  useLMS();
  const [heroQ, setHeroQ] = React.useState('');
  const [hp, setHp] = React.useState<any>(null);
  React.useEffect(() => { settingsApi.get().then((s) => setHp(s?.homepage)).catch(() => {}); }, []);
  const featured = DB.DOCS.slice(0, 10);
  const cats = (DB.DOC_FOLDERS || []).filter((f) => f !== 'Tất cả');
  const exercise = DB.STUDENT_TASKS.find((x) => x.status === 'todo') || DB.STUDENT_TASKS[0];
  const lead = DB.ARTICLES[0];
  const heroDoc = DB.DOCS[0];
  const latestArticles = DB.ARTICLES.slice(0, 4);
  const catIcons = ['book', 'docs', 'video', 'rubric', 'report', 'bulb', 'pen', 'star'];

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-7 pb-2 max-sm:px-4">
      <div className="lms-stagger bento mb-4">
        <div className="col-8 row-2 reveal bento-tile relative flex min-h-[320px] flex-col justify-center overflow-hidden border border-lms-line bg-(image:--lms-hero-gradient) p-[38px] max-sm:p-5">
          <span className="mb-[18px] inline-flex items-center gap-[7px] self-start rounded-[20px] border border-lms-line bg-lms-surface px-3 py-[5px] text-[11.5px] font-bold text-lms-accent">
            <Icon name="flame" size={14} stroke={p.accent} /> {hp?.badge || 'TÀI NGUYÊN HỌC TẬP · MIỄN PHÍ'}
          </span>
          <h1 className="m-0 max-w-[620px] font-lms-heading text-[clamp(30px,4.4vw,50px)] font-extrabold leading-[1.04] tracking-[-1.4px] text-lms-ink">
            {hp?.heroTitle || 'Học Tiếng Việt nhẹ nhàng, kho tài liệu mở cho tất cả.'}
          </h1>
          <p className="mt-[18px] mb-6 max-w-[480px] text-base leading-relaxed text-lms-sub">
            {hp?.heroSubtitle || 'Mình chia sẻ miễn phí kho tài liệu và bài tập môn Tiếng Việt Tiểu học — ai cũng có thể đọc, luyện tập và tải về.'}
          </p>
          <form action={ROUTES.library} method="get" className="flex max-w-[540px] flex-wrap gap-2.5">
            <Field p={p} icon="search" name="q" value={heroQ} onChange={setHeroQ} placeholder="Tìm tài liệu, tác phẩm, chủ đề…" className="min-w-[200px] flex-1! h-[50px]! rounded-xl!" />
            <Btn p={p} type="submit" size="lg" icon="arrowRight" className="rounded-xl!">{hp?.ctaLabel || 'Khám phá'}</Btn>
          </form>
        </div>
        <div className="col-4 reveal bento-tile hovlift flex cursor-default flex-col gap-3.5 border border-lms-line bg-lms-surface p-6 text-lms-ink">
          <div className="flex items-center gap-[13px]">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-lms-accent font-lms-heading text-[22px] font-bold text-white">PT</div>
            <div>
              <div className="text-[15.5px] font-bold text-lms-ink">Cô Phương Thanh</div>
              <div className="text-[12.5px] text-lms-sub">Giáo viên</div>
            </div>
          </div>
          <p className="m-0 text-[13.5px] leading-relaxed text-lms-sub">
            “Mình tin học liệu tốt nên đến được với mọi người. Tất cả ở đây đều miễn phí.”
          </p>
          <div className="mt-auto flex gap-2">
            <span className="rounded-[20px] bg-lms-accent-soft px-2.5 py-1 text-[11.5px] text-lms-sub">10+ năm kinh nghiệm giảng dạy</span>
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
        <Link
          href={ROUTES.libraryItem(heroDoc.id)}
          className="col-5 reveal bento-tile hovlift flex cursor-pointer flex-col overflow-hidden border border-lms-line bg-lms-surface no-underline"
        >
          <div className="relative flex h-[120px] items-end overflow-hidden bg-(image:--lms-feature-gradient) p-4">
            {heroDoc.thumb && <img src={heroDoc.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
            {heroDoc.thumb && <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />}
            <Tag p={p} color="#fff" soft={false} className="relative border border-white/50 text-white">HỌC LIỆU NỔI BẬT</Tag>
          </div>
          <div className="p-5">
            <div className="line-clamp-2 font-lms-heading text-lg font-bold wrap-break-word leading-snug text-lms-ink">{heroDoc.name}</div>
            <div className="mt-2 truncate text-[12.5px] text-lms-faint">{heroDoc.folder} · {heroDoc.size}</div>
          </div>
        </Link>
        )}

        {exercise && (
        <Link
          href={ROUTES.practiceItem(exercise.id)}
          className="col-4 reveal bento-tile hovlift flex cursor-pointer flex-col border border-lms-line bg-(image:--lms-card-gradient) p-6 no-underline"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-lms-line bg-lms-surface">
            <Icon name="assign" size={21} stroke={p.accent} />
          </div>
          <div className="mb-1.5 text-xs font-bold tracking-[0.3px] text-lms-accent">LUYỆN TẬP</div>
          <div className="font-lms-heading text-[19px] font-bold leading-snug text-lms-ink">{exercise.title}</div>
          <div className="mt-2 text-[12.5px] text-lms-sub">{exercise.type} · {exercise.questions} câu{exercise.learners ? ' · ' + exercise.learners + ' người làm' : ''}</div>
          <div className="mt-auto pt-4">
            <span className="inline-flex h-[34px] items-center gap-2 rounded-[11px] bg-lms-accent-soft px-3.5 text-[12.5px] font-semibold text-lms-accent">
              Làm thử ngay <Icon name="arrowRight" size={15} stroke={p.accent} sw={1.9} />
            </span>
          </div>
        </Link>
        )}

        {lead && (
        <Link
          href={ROUTES.blogPost(lead.id)}
          className="col-3 reveal bento-tile hovlift flex cursor-pointer flex-col border border-lms-line bg-lms-surface p-[22px] no-underline"
        >
          <div className="mb-2.5 text-xs font-bold tracking-[0.3px] text-lms-accent">BÀI VIẾT MỚI</div>
          <div className="font-lms-heading text-[17px] font-bold leading-snug text-lms-ink">{lead.title}</div>
          <p className="mt-2.5 mb-0 text-[12.5px] leading-snug text-lms-sub">{lead.excerpt}</p>
          <div className="mt-auto pt-3.5 text-xs text-lms-faint">{lead.read} đọc →</div>
        </Link>
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
        linkHref={ROUTES.library}
        empty={cats.length === 0}
        emptyDescription="Chưa có chủ đề"
        contentClassName="mb-10"
      >
        <div className="reveal mb-10 grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {cats.map((c, i) => (
            <Link
              key={c}
              href={`${ROUTES.library}?folder=${encodeURIComponent(c)}`}
              className="bento-tile hovlift block cursor-pointer border border-lms-line bg-lms-surface p-[18px] no-underline"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent-soft">
                <Icon name={catIcons[i % catIcons.length]} size={19} stroke={p.accent} />
              </div>
              <div className="text-sm font-semibold text-lms-ink">{c}</div>
              <div className="mt-[3px] text-[11.5px] text-lms-faint">{DB.DOCS.filter((d) => d.folder === c).length} học liệu</div>
            </Link>
          ))}
        </div>
      </HomeSection>

      <HomeSection
        title="Học liệu nổi bật"
        linkLabel="Xem thêm →"
        linkHref={ROUTES.library}
        empty={featured.length === 0}
        emptyDescription="Chưa có học liệu"
        contentClassName="mb-11"
      >
        <div className="reveal mb-11 grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
          {featured.map((d) => {
            const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
            return (
              <Link key={d.id} href={ROUTES.libraryItem(d.id)} className="bento-tile hovlift block cursor-pointer overflow-hidden border border-lms-line bg-lms-surface no-underline">
                <div className="relative flex h-[92px] items-center justify-center overflow-hidden bg-lms-accent-soft">
                  <Icon name={m.icon} size={28} stroke={p.accent} sw={1.4} />
                  {d.thumb && <img src={d.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
                  <span className={`absolute top-2.5 left-2.5 z-2 ${d.thumb ? 'rounded-[7px] bg-white/92 shadow-sm backdrop-blur-sm' : ''}`}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                </div>
                <div className="p-4">
                  <div className="min-h-9 text-[13.5px] font-semibold leading-snug text-lms-ink">{d.name}</div>
                  <div className="mt-2.5 font-mono text-[11px] text-lms-faint">{d.folder} · {d.size}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </HomeSection>

      <HomeSection
        title="Bài viết mới nhất"
        linkLabel="Tất cả bài viết →"
        linkHref={ROUTES.blog}
        empty={latestArticles.length === 0}
        emptyDescription="Chưa có bài viết"
        contentClassName="pb-2"
      >
        <div className="reveal grid gap-4 pb-2 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {latestArticles.map((a) => (
            <Link key={a.id} href={ROUTES.blogPost(a.id)} className="bento-tile hovlift block cursor-pointer border border-lms-line bg-lms-surface p-5 no-underline">
              <span className="mb-2.5 inline-block rounded-md bg-lms-accent-soft px-[9px] py-[3px] text-[11px] font-bold text-lms-accent">{a.cat}</span>
              <h3 className="m-0 font-lms-heading text-[17px] font-bold leading-snug text-lms-ink">{a.title}</h3>
              <p className="my-2 text-[13px] leading-snug text-lms-sub">{a.excerpt}</p>
              <div className="text-[11.5px] text-lms-faint">{a.author} · {a.read} đọc</div>
            </Link>
          ))}
        </div>
      </HomeSection>
    </div>
  );
}

export function SOverview({ p, t, setRoute, go }) {
  const auth = useLmsAuth();
  const attempts = useMyAttempts();
  const todo = DB.STUDENT_TASKS.filter((x) => x.status === 'todo');
  const graded = DB.STUDENT_TASKS.filter((x) => x.status === 'graded' || (x.status === 'done' && x.score));

  const gradedAttempts = attempts.filter((a) => a.status === 'graded' && a.score != null);
  const avgScore = gradedAttempts.length
    ? Math.round((gradedAttempts.reduce((s, a) => s + a.score, 0) / gradedAttempts.length) * 10) / 10
    : null;
  const avgPctList = gradedAttempts
    .map((a) => (a.percent != null ? a.percent : a.points ? Math.round((a.score / a.points) * 100) : null))
    .filter((x): x is number => x != null);
  const avgPct = avgPctList.length ? Math.round(avgPctList.reduce((s, x) => s + x, 0) / avgPctList.length) : 0;
  const dueToday = todo.filter((x) => x.dueIn === 'Hôm nay').length;

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-[30px] pb-10">
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-2.5 font-mono text-[11.5px] tracking-[1px] text-lms-faint">KHÔNG GIAN HỌC TẬP</div>
          <h2 className="m-0 font-lms-heading text-4xl font-medium leading-[1.05] tracking-[-0.6px] text-lms-ink">
            Chào bạn, <span className="text-lms-accent">{auth.name || 'bạn'}.</span>
          </h2>
          <p className="mt-3 mb-0 max-w-[480px] text-[14.5px] leading-normal text-lms-sub">
            {todo.length > 0 ? (
              <>Bạn có <strong className="text-lms-ink">{todo.length} bài tập</strong> cần hoàn thành{dueToday > 0 ? <>, trong đó <strong className="text-lms-ink">{dueToday} bài đến hạn hôm nay</strong></> : null}.</>
            ) : (
              <>Bạn đã hoàn thành hết bài tập được giao. Khám phá thêm học liệu để ôn tập nhé.</>
            )}
          </p>
        </div>
        {avgScore != null && (
          <div className={`${cardClass(20)} flex items-center gap-4`}>
            <Ring value={avgPct} size={64} thickness={7} p={p} color={p.accent} label={avgScore.toFixed(1)} />
            <div><div className="text-[13px] text-lms-sub">Điểm trung bình</div>
              <div className="mt-0.5 font-lms-heading text-base font-semibold text-lms-ink">{gradedAttempts.length} bài đã chấm</div></div>
          </div>
        )}
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
              <Btn p={p} variant="soft" size="sm" onClick={() => go('s-task', { task: task.id })}>Làm bài</Btn>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-[22px]">
          <section className="rounded-xl border border-lms-line bg-(image:--lms-card-gradient) p-[22px]">
            <Icon name="book" size={22} stroke={p.accent} />
            <h3 className="my-3 mb-1.5 font-lms-heading text-[19px] font-semibold text-lms-ink">Kho học liệu</h3>
            <p className="mb-4 mt-0 text-[13px] leading-normal text-lms-sub">Tìm tài liệu, sơ đồ tư duy để đọc và ôn tập.</p>
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

function STaskRow({ task, p }) {
  const tone = taskTone(p, task.status);
  const body = (
    <>
      <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${taskIconBg(task.status)}`}>
        <Icon name={task.status === 'graded' ? 'checkCircle' : 'assign'} size={20} stroke={tone} /></div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[14.5px] font-semibold text-lms-ink">{task.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-lms-sub">
          {task.subject && <span className="rounded-md bg-lms-accent-soft px-2 py-[2px] font-semibold text-lms-accent">{task.subject}</span>}
          {task.type && <span>{task.type}</span>}
          <span className="inline-flex items-center gap-1"><Icon name="users" size={13} stroke={p.faint} /> {task.learners ?? 0} người đã làm</span>
          <span className="inline-flex items-center gap-1"><Icon name="eye" size={13} stroke={p.faint} /> {task.views ?? 0} lượt xem</span>
          <span className="inline-flex items-center gap-1"><Icon name="assign" size={13} stroke={p.faint} /> {task.questions ?? 0} câu</span>
          <span className="inline-flex items-center gap-1"><Icon name="star" size={13} stroke={p.faint} /> {task.points} điểm</span>
          {task.due && <span className="inline-flex items-center gap-1"><Icon name="calendar" size={13} stroke={p.faint} /> hạn {task.due}</span>}
        </div>
      </div>
      {task.score != null
        ? <div className="text-center"><div className="font-lms-heading text-[22px] font-semibold text-lms-ok">{task.score}</div><div className="text-[10px] text-lms-faint">/{task.points}</div></div>
        : <Tag p={p} color={tone}>{task.dueIn}</Tag>}
      {task.status === 'todo' ? (
        <span className="inline-flex h-[34px] items-center gap-2 rounded-[11px] bg-lms-accent-soft px-3.5 text-[12.5px] font-semibold text-lms-accent">
          Làm bài <Icon name="arrowRight" size={15} stroke={p.accent} sw={1.9} />
        </span>
      ) : (
        <Tag p={p} color={taskTone(p, task.status)}>{taskLabel(task.status)}</Tag>
      )}
    </>
  );
  if (task.status === 'todo') {
    return (
      <Link href={ROUTES.practiceItem(task.id)} style={{ background: p.surface }} className="lms-card flex items-center gap-4 rounded-xl border border-lms-line px-5 py-4 no-underline">
        {body}
      </Link>
    );
  }
  return (
    <div className="lms-card flex cursor-default items-center gap-4 rounded-xl border border-lms-line bg-lms-surface px-5 py-4">
      {body}
    </div>
  );
}

const EX_GRADE_OPTS = [
  { value: 'Lớp 4', label: 'Lớp 4' },
  { value: 'Lớp 5', label: 'Lớp 5' },
  { value: 'Lớp 4–5', label: 'Lớp 4–5' },
];
const EX_SUBJECT_OPTS = [
  { value: 'Tiếng Việt', label: 'Tiếng Việt' },
  { value: 'Hoạt động Viết', label: 'Hoạt động Viết' },
  { value: 'Đọc hiểu', label: 'Đọc hiểu' },
  { value: 'Luyện từ và câu', label: 'Luyện từ và câu' },
];
const EX_SORT_OPTS = [
  { value: 'date:desc', label: 'Mới nhất' },
  { value: 'date:asc', label: 'Cũ nhất' },
  { value: 'points:desc', label: 'Điểm cao nhất' },
  { value: 'name:asc', label: 'Tên A → Z' },
  { value: 'name:desc', label: 'Tên Z → A' },
];

export function STasks({ p, t }) {
  useLMS();
  const exFolders = (DB as any).EX_FOLDERS || [];
  const folderOpts = exFolders.map((f: any) => ({ value: String(f.id), label: f.name }));

  const paged = usePagedResource<any>({ fetcher: exercisesApi.list, mapper: mapExercise });
  const { records, loading, error } = paged;
  const [sortKey, setSortKey] = React.useState('date:desc');
  const changeSort = (v: string) => {
    setSortKey(v);
    const [by, order] = v.split(':');
    paged.setFilter('sortBy', by === 'date' ? '' : by); // date desc = default, no param
    paged.setFilter('order', order);
  };

  const myStatusOf = (id: string) => {
    const s = (DB.STUDENT_TASKS || []).find((x: any) => x.id === id);
    return s?.status ?? 'todo';
  };
  const list = records.map((e) => ({ ...e, status: myStatusOf(e.id), score: undefined }));

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
        <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm bài tập…" className="w-[240px]" />
        <FilterSelect label="HÌNH THỨC" p={p} value={paged.filters.type} options={EX_TYPE_OPTS} onChange={(v) => paged.setFilter('type', v)} />
        <FilterSelect label="TRẠNG THÁI" p={p} value={paged.filters.status} options={EX_STATUS_OPTS} onChange={(v) => paged.setFilter('status', v)} />
        <FilterSelect label="LỚP" p={p} value={paged.filters.grade} options={EX_GRADE_OPTS} onChange={(v) => paged.setFilter('grade', v)} />
        <FilterSelect label="MÔN" p={p} value={paged.filters.subject} options={EX_SUBJECT_OPTS} onChange={(v) => paged.setFilter('subject', v)} />
        {folderOpts.length > 0 && (
          <FilterSelect label="THƯ MỤC" p={p} value={paged.filters.folderId} options={folderOpts} onChange={(v) => paged.setFilter('folderId', v)} />
        )}
        <div className="flex-1" />
        <span className="shrink-0 font-mono text-[11.5px] text-lms-faint">Sắp xếp</span>
        <div className="w-[180px] shrink-0"><Select p={p} value={sortKey} onChange={changeSort} options={EX_SORT_OPTS} /></div>
      </div>
      {loading ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">Đang tải…</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-lms-line bg-lms-surface py-10">
          <Empty
            description={error ? 'Không tải được dữ liệu' : 'Không có kết quả'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="lms-stagger flex flex-col gap-3">
          {list.map((task) => <STaskRow key={task.id} task={task} p={p} />)}
        </div>
      )}
      <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
    </div>
  );
}

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
      if (Array.isArray(detail.pairs)) {
        // Owner-preview: full pairs available.
        pairs = detail.pairs.map((pr: any) => [pr.left, pr.right] as [string, string]);
      } else {
        // Non-owner: server strips pairs and sends lefts[] (real labels) + rightOptions[]
        // (shuffled pool). Rebuild MatchBoard's [left, right] shape: pr[0] = left prompt,
        // pr[1] feeds the draggable pool.
        const lefts: string[] = detail.lefts ?? [];
        const rightOptions: string[] = detail.rightOptions ?? [];
        pairs = lefts.map((l: string, i: number) => [l, rightOptions[i]] as [string, string]);
      }
    }
  } catch { /* tolerate malformed questionDetail */ }
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

// Server auto-grades from stored answers — send raw selection only, never isCorrect.
function buildSubmitAnswer(q: any, raw: any): any {
  const out: any = { questionId: q.questionId || q.id };
  const choices = (raw && raw.choices) || [];
  if (q.type === 'single') {
    out.answer = choices.length ? choices[0] : null;
  } else if (q.type === 'multi') {
    out.answer = choices;
  } else if (q.type === 'truefalse') {
    out.answer = choices.length ? choices[0] === 0 : null;
  } else if (q.type === 'fill') {
    out.answer = (raw && raw.text) || '';
  } else if (q.type === 'match') {
    const map = (raw && raw.map) || {};
    out.answer = Object.keys(map).map((k) => ({
      left: (q.pairs && q.pairs[Number(k)] && q.pairs[Number(k)][0]) ?? k,
      right: map[k],
    }));
  } else {
    out.answer = raw && raw.text != null ? raw.text : raw;
  }
  return out;
}

export function STask({ p, t, ctx, auth }) {
  const task = DB.STUDENT_TASKS.find((x) => x.id === ctx.task);
  const [liveQs, setLiveQs] = React.useState(null);
  const [exType, setExType] = React.useState(null);
  const [cur, setCur] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [submitError, setSubmitError] = React.useState(null);
  const [ws, setWs] = React.useState(null);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [scoreScale, setScoreScale] = React.useState(DEFAULT_SCORE_SCALE);
  const [loadingEx, setLoadingEx] = React.useState(true);
  const [meta, setMeta] = React.useState<any>(null);
  const autoSubmittedRef = React.useRef(false);
  const submitNowRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    const exId = ctx.task;
    if (!exId) { setLoadingEx(false); return; }
    let alive = true;
    setLoadingEx(true);
    setLiveQs(null); setExType(null); setMeta(null); setCur(0); setAnswers({}); setResult(null); setSubmitError(null); setRemaining(null); setMaterials([]); setWs(null);
    autoSubmittedRef.current = false;
    (async () => {
      try {
        const ex = await exercisesApi.get(exId);
        if (!alive || !ex) return;
        setMeta({
          title: ex.title ?? 'Bài tập',
          type: typeVi(ex.type),
          points: ex.points ?? 10,
          questions: (ex.questions || []).length,
          durationMinutes: Number(ex.durationMinutes) || 0,
          maxAttempts: ex.maxAttempts ?? 1,
          subject: ex.subject ?? '',
          grade: ex.grade ?? '',
          instructions: ex.instructions ?? '',
        });
        setExType(ex.type ?? null);
        const mapped = (ex.questions || []).map(mapApiQuestion).filter(Boolean);
        const mins = Number(ex.durationMinutes);
        if (Number.isFinite(mins) && mins > 0) setRemaining(mins * 60);
        setLiveQs(mapped);
        const matIds: string[] = (ex.materialIds || []).map((m: any) => String(m?._id ?? m));
        const docs = matIds
          .map((id) => {
            const f = (DB.DOCS || []).find((d: any) => String(d.id) === id);
            return f ? { id, name: f.name, url: f.url || '' } : null;
          })
          .filter(Boolean);
        setMaterials(docs as any[]);
      } catch { /* exercise load failed */ }
      finally { if (alive) setLoadingEx(false); }
    })();
    return () => { alive = false; };
  }, [ctx.task]);

  React.useEffect(() => {
    if (remaining == null || result) return;
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => {
      if (s == null) return s;
      const next = Math.max(0, s - 1);
      if (next === 0) {
        clearInterval(id);
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          submitNowRef.current();
        }
      }
      return next;
    }), 1000);
    return () => clearInterval(id);
  }, [remaining == null, result]);

  React.useEffect(() => { if (auth && !auth.loggedIn) auth.open(); }, [auth?.loggedIn]);

  React.useEffect(() => {
    settingsApi.get().then((s) => { const sc = s?.academic?.scoreScale; if (sc) setScoreScale(sc); }).catch(() => {});
  }, []);

  if (auth && !auth.loggedIn) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3.5 p-[30px] text-center">
        <p className="m-0 max-w-[420px] text-[14.5px] leading-relaxed text-lms-sub">Cần đăng nhập để làm bài tập.</p>
        <div className="flex gap-2.5">
          <Btn p={p} icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Link href={ROUTES.practice} className="lms-btn inline-flex h-10 items-center gap-2 rounded-[11px] border border-lms-line bg-lms-surface px-[18px] text-[13.5px] font-semibold text-lms-ink no-underline">
            Quay lại
          </Link>
        </div>
      </div>
    );
  }
  if (loadingEx) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3.5">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-lms-line border-t-lms-accent" />
          <span className="text-[13px] text-lms-sub">Đang tải bài tập…</span>
        </div>
      </div>
    );
  }

  const essay = exType === 'essay';
  const qs = (liveQs || []).filter(Boolean);
  const cur2 = Math.min(cur, Math.max(0, qs.length - 1));
  const q = qs[cur2];
  const answered = Object.keys(answers).length;

  async function submitNow() {
    if (submitting) return;
    setSubmitError(null);
    if (auth && !auth.loggedIn) { auth.open(); return; }
    if (!liveQs || !liveQs.length) {
      setSubmitError('Bài tập chưa tải được câu hỏi từ máy chủ nên chưa thể nộp. Hãy tải lại trang và thử lại.');
      return;
    }
    setSubmitting(true);
    try {
      const attempt = await attemptsApi.start(ctx.task);
      const attemptId = attempt?._id;
      if (!attemptId) throw new Error('no-attempt');
      const payload = liveQs.map((qq) => buildSubmitAnswer(qq, answers[qq.id]));
      const submitted: any = await attemptsApi.submit(attemptId, payload);
      let res: any = null;
      try { res = await attemptsApi.result(attemptId); } catch { /* result optional */ }
      const sub = res?.submission ?? submitted ?? {};
      const score = typeof sub?.totalScore === 'number' ? sub.totalScore : null;
      setResult({
        score,
        correct: typeof sub?.correct === 'number' ? sub.correct : 0,
        total: liveQs.length,
        percent: typeof sub?.percent === 'number' ? sub.percent : null,
        graded: !!sub?.isGraded,
        waiting: sub?.waitingGrades ?? sub?.numberOfEssays ?? 0,
      });
      try { await hydrateFor('s-task'); } catch { /* hydrate optional */ }
    } catch (err: any) {
      setSubmitError(err?.message || 'Nộp bài thất bại. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  submitNowRef.current = submitNow;

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
            <div className={`font-lms-heading text-[30px] font-extrabold ${result.score != null && result.score >= scoreScale * 0.8 ? 'text-lms-ok' : 'text-lms-ink'}`}>
              {result.score != null ? result.score : `${result.correct}/${result.total}`}
            </div>
            <div className="mt-1 text-xs text-lms-faint">{result.score != null ? `điểm / ${scoreScale}` : 'câu đúng'}</div>
          </div>
          <div className={`${cardClass(20)} flex min-w-[120px] flex-col items-center justify-center gap-2 p-[18px]`}>
            <Ring value={pct} size={56} thickness={6} p={p} color={p.accent} label={`${pct}%`} />
            <div className="text-xs text-lms-faint">tỉ lệ đúng</div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link href={ROUTES.practice} className="lms-btn inline-flex h-[46px] items-center gap-2 rounded-[11px] bg-lms-accent px-[18px] text-[13.5px] font-semibold text-white no-underline shadow-[0_2px_0_var(--lms-glow)]">
            <Icon name="arrowLeft" size={16} stroke="#fff" sw={1.9} /> Về danh sách bài
          </Link>
        </div>
      </div>
    );
  }
  const worksheets = materials;

  const downloadWorksheet = (w: any) => {
    if (typeof window === 'undefined') return;
    if (w?.url) window.open(w.url, '_blank', 'noopener');
  };

  if (!q) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-[30px] text-center">
        <div className="mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px] bg-lms-accent-soft">
          <Icon name="assign" size={28} stroke={p.accent} />
        </div>
        <h2 className="m-0 font-lms-heading text-2xl font-extrabold text-lms-ink">Bài tập chưa có câu hỏi</h2>
        <p className="my-2.5 mb-[22px] max-w-[400px] text-sm leading-relaxed text-lms-sub">Bài này hiện chưa có câu hỏi nào để làm. Hãy quay lại sau nhé.</p>
        <Link href={ROUTES.practice} className="lms-btn inline-flex h-10 items-center gap-2 rounded-[11px] bg-lms-accent px-[18px] text-[13.5px] font-semibold text-white no-underline shadow-[0_2px_0_var(--lms-glow)]">
          <Icon name="arrowLeft" size={16} stroke="#fff" sw={1.9} /> Về danh sách bài
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-lms-line px-[30px] py-4">
        <Link href={ROUTES.practice} className="lms-link inline-flex items-center gap-1.5 text-[13px] text-lms-sub no-underline">
          <Icon name="x" size={16} stroke={p.sub} /> Thoát
        </Link>
        <div className="h-[26px] w-px bg-lms-line" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-lms-ink">{meta?.title ?? task?.title ?? 'Bài tập'}</div>
          <div className="mt-0.5 truncate text-xs text-lms-faint">
            {[
              meta?.type ?? task?.type,
              meta?.subject ? `${meta.subject}${meta?.grade ? ` · ${meta.grade}` : ''}` : null,
              `${meta?.points ?? task?.points ?? 10} điểm`,
              essay ? null : `${qs.length} câu`,
              `Tối đa ${meta?.maxAttempts ?? 1} lượt`,
            ].filter(Boolean).join('  ·  ')}
          </div>
        </div>
        {remaining != null && (
          <div className="flex items-center gap-2 rounded-[10px] border border-lms-line bg-lms-surface px-[13px] py-[7px]">
            <Icon name="clock" size={15} stroke={remaining <= 60 ? p.danger : p.warn} />
            <span className={`font-mono text-[13px] ${remaining <= 60 ? 'text-lms-danger' : 'text-lms-ink'}`}>
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <div className="lms-scroll flex-1 overflow-y-auto p-[30px] max-sm:p-4">
        <div className="mx-auto max-w-[680px]">
          {worksheets.length > 0 && (
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
                <p className="mb-2.5 mt-0 text-[13.5px] leading-[1.8] text-pretty text-lms-sub">Tệp đính kèm của bài tập. Mở để xem hoặc tải về tham khảo khi làm bài.</p>
                {ws.url
                  ? <Btn p={p} variant="ghost" size="sm" icon="download" onClick={() => downloadWorksheet(ws)}>Mở phiếu</Btn>
                  : <div className="text-[12.5px] text-lms-faint">Tệp này chưa có liên kết để mở.</div>}
              </div>
            )}
          </div>
          )}
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
            <RichText html={q.stem} className="mb-[22px] text-lg font-medium leading-normal text-lms-ink" />
            <QuestionView q={q} p={p} mode="do" answer={answers[q.id]} onAnswer={(v) => setAnswers({ ...answers, [q.id]: v })} />
          </div>

          {submitError && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-lms-danger/30 bg-lms-danger/8 p-3.5">
              <Icon name="x" size={18} stroke={p.danger} />
              <div className="text-[13.5px] leading-normal text-lms-ink">{submitError}</div>
            </div>
          )}
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

const DOC_FORMAT_OPTS = [
  { value: '', label: 'Tất cả định dạng' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Ảnh' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'slide', label: 'Slide' },
  { value: 'doc', label: 'Tài liệu (Word/Docs)' },
  { value: 'link', label: 'Liên kết' },
];
const DOC_SORT_OPTS = [
  { value: 'date:desc', label: 'Mới nhất' },
  { value: 'date:asc', label: 'Cũ nhất' },
  { value: 'views:desc', label: 'Xem nhiều nhất' },
  { value: 'downloads:desc', label: 'Tải nhiều nhất' },
  { value: 'name:asc', label: 'Tên A → Z' },
  { value: 'name:desc', label: 'Tên Z → A' },
];

export function SDocs({ p, t }) {
  useLMS();
  const searchParams = useSearchParams();
  const paged = usePagedResource<any>({ fetcher: filesApi.list, mapper: mapFile });
  const { records: list, loading, error } = paged;
  const [folderName, setFolderName] = React.useState('Tất cả');
  const [fileType, setFileType] = React.useState('');
  const [sortKey, setSortKey] = React.useState('date:desc');

  const pickFolder = React.useCallback((f: string) => {
    setFolderName(f);
    const tree: any[] = (DB as any).DOC_FOLDER_TREE || [];
    const id = f === 'Tất cả' ? '' : (tree.find((x: any) => x.name === f)?.id || '');
    paged.setFilter('folderId', id);
  }, [paged]);

  // Deep-link from the home "Khám phá theo chủ đề" cards (?folder=<tên>): select that
  // folder once its tree/list has loaded. Runs once.
  const folderParam = searchParams?.get('folder') || '';
  const folderApplied = React.useRef(false);
  React.useEffect(() => {
    if (!folderParam || folderApplied.current) return;
    if ((DB.DOC_FOLDERS || []).includes(folderParam)) {
      pickFolder(folderParam);
      folderApplied.current = true;
    }
  }, [folderParam, list.length, pickFolder]);

  const changeFileType = (v: string) => { setFileType(v); paged.setFilter('fileType', v); };
  const changeSort = (v: string) => {
    setSortKey(v);
    const [by, order] = v.split(':');
    paged.setFilter('sortBy', by === 'date' ? '' : by); // date desc = default, no param
    paged.setFilter('order', order);
  };

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="reveal mb-[22px] rounded-[18px] border border-lms-line bg-(image:--lms-hero-gradient) px-[30px] py-[34px] max-sm:px-4 max-sm:py-6">
        <h2 className="m-0 font-lms-heading text-[26px] font-bold tracking-[-0.4px] text-lms-ink">
          Kho <span className="text-lms-accent">học liệu</span>
        </h2>
        <p className="mt-2 mb-[18px] max-w-[520px] text-sm leading-normal text-lms-sub">
          Tìm tài liệu và sơ đồ tư duy để đọc, ôn tập và làm bài.
        </p>
        <div className="max-w-[560px]">
          <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm theo tên tài liệu, chủ đề…" className="h-[46px]" />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {DB.DOC_FOLDERS.map((f) => {
          const n = f === 'Tất cả' ? DB.DOCS.length : DB.DOCS.filter((d) => d.folder === f).length;
          return <Pill key={f} p={p} active={f === folderName} onClick={() => pickFolder(f)}>{f} · {n}</Pill>;
        })}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[150px]"><Select p={p} value={fileType} onChange={changeFileType} options={DOC_FORMAT_OPTS} /></div>
        <div className="flex-1" />
        <span className="shrink-0 font-mono text-[11.5px] text-lms-faint">Sắp xếp</span>
        <div className="flex-1 min-w-[150px]"><Select p={p} value={sortKey} onChange={changeSort} options={DOC_SORT_OPTS} /></div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">Đang tải…</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-lms-line bg-lms-surface py-10">
          <Empty
            description={error ? 'Không tải được dữ liệu' : 'Không tìm thấy học liệu — thử từ khóa hoặc chủ đề khác'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="lms-stagger reveal grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {list.map((d) => {
            const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
            return (
              <Link key={d.id} href={ROUTES.libraryItem(d.id)} className="bento-tile hovlift block cursor-pointer overflow-hidden border border-lms-line bg-lms-surface no-underline">
                <div className="relative flex h-24 items-center justify-center overflow-hidden bg-lms-accent-soft">
                  <Icon name={m.icon} size={30} stroke={p.accent} sw={1.4} />
                  {d.thumb && <img src={d.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
                  <span className={`absolute top-2.5 left-2.5 z-2 rounded-[7px] ${d.thumb ? 'bg-white/92 shadow-sm backdrop-blur-sm' : ''}`}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                  <span className={`absolute top-2.5 right-2.5 z-2 rounded-[7px] ${d.thumb ? 'bg-white/92 shadow-sm backdrop-blur-sm' : ''}`}><Tag p={p} color={p.sub}>{d.folder}</Tag></span>
                </div>
                <div className="p-3.5">
                  <div className="line-clamp-2 min-h-9 text-[13.5px] font-semibold wrap-break-word leading-snug text-lms-ink">{d.name}</div>
                  {d.desc && <div className="mt-1.5 line-clamp-2 text-[11.5px] wrap-break-word leading-snug text-lms-sub">{stripHtml(d.desc).slice(0, 110)}</div>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-lms-faint">👁 {d.views ?? 0} · ↓ {d.downloads}</span>
                    <span className="inline-flex h-[34px] items-center gap-2 rounded-[11px] bg-lms-accent-soft px-3.5 text-[12.5px] font-semibold text-lms-accent">
                      Đọc <Icon name="arrowRight" size={15} stroke={p.accent} sw={1.9} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
    </div>
  );
}

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
export function SDocReader({ p, t, ctx }) {
  useLMS();
  const id = ctx.doc;
  // Fetch the exact file by id on mount: loads docs missing from the first-page list
  // AND triggers the backend viewCount $inc (GET /files/:id) so "lượt xem" goes up.
  const [loading, setLoading] = React.useState(() => !DB.DOCS.find((x: any) => x.id === id));
  React.useEffect(() => {
    let alive = true;
    if (!DB.DOCS.find((x: any) => x.id === id)) setLoading(true);
    loadDoc(id).finally(() => {
      if (!alive) return;
      LMS.bump();
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  const d = DB.DOCS.find((x) => x.id === id);
  // Still fetching and nothing to show yet: render loading rather than a wrong doc.
  if (loading && !d) return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3.5">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-lms-line border-t-lms-accent" />
        <span className="text-[13px] text-lms-sub">Đang tải tài liệu…</span>
      </div>
    </div>
  );
  if (!d) {
    return (
      <EmptyState
        p={p}
        icon="book"
        label="Không có tài liệu"
        sub="Chưa có nội dung."
        action={
          <Link href={ROUTES.library} className="mt-1 inline-flex h-[34px] items-center gap-2 rounded-[11px] bg-lms-accent-soft px-3.5 text-[12.5px] font-semibold text-lms-accent no-underline">
            <Icon name="arrowLeft" size={15} stroke={p.accent} sw={1.9} /> Về kho học liệu
          </Link>
        }
      />
    );
  }
  const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
  const related = DB.DOCS.filter((x) => x.folder === d.folder && x.id !== d.id).slice(0, 4);
  // "Bài tập liên quan" = lọc trang luyện tập theo tag của tài liệu (fallback:
  // tên chủ đề/thư mục), qua ?q= mà usePagedResource tự đọc.
  const relatedKw = (Array.isArray(d.tags) && d.tags[0]) || d.folder || '';
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
      <Link href={ROUTES.library} className="lms-link mb-4 inline-flex items-center gap-1.5 text-[13px] text-lms-sub no-underline">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Kho học liệu
      </Link>
      <div className="mb-[22px] flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-lms-accent-soft">
          <Icon name={m.icon} size={26} stroke={p.accent} /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex gap-2"><Tag p={p} color={p.accent}>{m.label}</Tag><Tag p={p} color={p.sub}>{d.folder}</Tag></div>
          <h2 className="m-0 font-lms-heading text-2xl font-bold wrap-break-word leading-tight tracking-[-0.3px] text-lms-ink">{d.name}</h2>
          <div className="mt-1.5 text-[12.5px] text-lms-faint">{d.by} · cập nhật {d.updated} · {d.size} · ↓ {d.downloads} lượt tải</div>
        </div>
        {(DB.DOWNLOADS || []).includes(d.id)
          ? <Btn p={p} variant="soft" icon="check">Đã tải</Btn>
          : <Btn p={p} icon="download" onClick={async () => {
              if (d.url) window.open(d.url, '_blank');
              // Record the real download count best-effort — no mock fallback.
              try {
                await filesApi.download(d.id);
                await hydrateFor('s-doc');
              } catch { /* count best-effort */ }
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
          : <p className="m-0 text-[15.5px] leading-[1.9] text-lms-sub">Tài liệu được chia sẻ từ kho học liệu. Bấm “Mở trên Google Drive” để xem bản đầy đủ.</p>}
        <div className="mt-[18px] flex flex-wrap gap-2.5">
          <Link href={withKeyword(ROUTES.practice, relatedKw)} className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-lms-accent-soft px-[18px] text-[13.5px] font-semibold text-lms-accent no-underline">
            <Icon name="assign" size={16} stroke={p.accent} sw={1.9} /> Làm bài tập liên quan
          </Link>
          <Link href={ROUTES.selfCheck} className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-lms-line bg-lms-surface px-[18px] text-[13.5px] font-semibold text-lms-ink no-underline">
            <Icon name="rubric" size={16} stroke={p.ink} sw={1.9} /> Tự đánh giá
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h3 className="mb-3.5 mt-0 font-lms-heading text-lg font-semibold text-lms-ink">Học liệu liên quan</h3>
          <div className="lms-stagger grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {related.map((r) => {
              const rm = DOC_TYPE_META[r.type] || DOC_TYPE_META.doc;
              return (
                <Link key={r.id} href={ROUTES.libraryItem(r.id)} className={`lms-card lms-row ${cardClass(20)} flex items-center gap-3 p-3.5 no-underline`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lms-accent-soft">
                    <Icon name={rm.icon} size={18} stroke={p.accent} /></div>
                  <div className="min-w-0"><div className="line-clamp-2 text-[13px] font-semibold wrap-break-word leading-snug text-lms-ink">{r.name}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-lms-faint">{rm.label}</div></div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SSelfCheck({ p, t }) {
  useLMS();
  // Each writing task carries its own rubric (essay exercise → rubricId). Selecting a
  // task shows THAT task's criteria table. Fall back to picking a rubric directly if
  // no rubric-linked writing tasks are loaded.
  const rubrics = DB.RUBRICS || [];
  const works = React.useMemo(() => {
    const tasks = (DB.ASSIGNMENTS || [])
      .filter((e: any) => e.rubric && rubrics.some((r: any) => r.id === e.rubric))
      .map((e: any) => ({ id: e.id, title: e.title, rubricId: e.rubric, isExercise: true, exerciseId: e.id }));
    if (tasks.length) return tasks;
    // Rubric-only fallback: w.id is a RUBRIC id, not an exercise — do not persist exerciseId.
    return rubrics.map((r: any) => ({ id: r.id, title: r.name, rubricId: r.id, isExercise: false }));
  }, [DB.ASSIGNMENTS, rubrics]);
  const [workId, setWorkId] = React.useState<string>('');
  const work = works.find((w: any) => w.id === workId) || works[0];
  const rubric = (work && rubrics.find((r: any) => r.id === work.rubricId)) || rubrics[0];
  const [sel, setSel] = React.useState({});
  const [note, setNote] = React.useState('');
  const [savingSelf, setSavingSelf] = React.useState(false);
  const [savedSelf, setSavedSelf] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const selfScore = React.useMemo(() => {
    if (!rubric) return null;
    let sum = 0, any = false;
    rubric.criteria.forEach((c, ci) => { if (sel[ci] != null) { any = true; sum += c.weight * rubric.scale[sel[ci]].pct / 100; } });
    return any ? Math.round((sum / 10) * 10) / 10 : null;
  }, [sel, rubric]);
  React.useEffect(() => { setSel({}); setNote(''); setSavedSelf(false); setSaveError(null); }, [workId]);

  async function saveSelf() {
    if (savingSelf || !rubric) return;
    setSavingSelf(true);
    setSaveError(null);
    try {
      // Only emit scores when criterion/level ids are present (valid Mongo refs).
      const scores = Object.keys(sel)
        .map((k) => {
          const ci = Number(k);
          const si = sel[ci];
          const crit = rubric.criteria[ci] || {};
          const lvl = (rubric.scale && rubric.scale[si]) || {};
          const criterionId = crit.id ?? crit.criterionId ?? crit._id;
          if (!criterionId) return null;
          const levelId = lvl.levelId ?? lvl.id ?? lvl._id;
          return {
            criterionId,
            ...(levelId ? { levelId } : {}),
            percent: typeof lvl.pct === 'number' ? lvl.pct : 0,
          };
        })
        .filter(Boolean);

      await selfAssessmentsApi.create({
        rubricId: rubric.id,
        source: work?.isExercise ? 'exercise' : 'text',
        ...(work?.isExercise && work.exerciseId ? { exerciseId: work.exerciseId } : {}),
        totalPercent: selfScore != null ? Math.round(selfScore * 10) : undefined,
        ...(scores.length ? { scores } : {}),
        note,
        text: note,
      });
      setSavedSelf(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Lưu tự đánh giá thất bại. Vui lòng đăng nhập và thử lại.');
    } finally {
      setSavingSelf(false);
    }
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
        <label className={lblClass()}>CHỌN BÀI VIẾT ĐỂ TỰ ĐÁNH GIÁ</label>
        <Select p={p} value={work?.id ?? ''} onChange={setWorkId} className="mt-2 max-w-[460px]"
          options={works.map((w: any) => ({ value: w.id, label: w.title }))} />
        {work && <div className="mt-2 text-[12.5px] text-lms-sub">Bộ tiêu chí: <span className="font-semibold text-lms-accent">{rubric?.name}</span></div>}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[961px]:grid-cols-[1.5fr_1fr]">
        <section className={cardClass(20)}>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="m-0 font-lms-heading text-[17px] font-semibold text-lms-ink">{rubric.name}</h3>
            <Tag p={p} color={p.accent}>{Object.keys(sel).length}/{rubric.criteria.length} tiêu chí</Tag>
          </div>
          <div className="lms-scrollx">
            <RubricMatrix rubric={rubric} p={p} mode="grade" selected={sel} onSelect={(ci, si) => { setSel({ ...sel, [ci]: si }); setSavedSelf(false); }} />
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
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setSavedSelf(false); }} placeholder="Mình cần cải thiện điều gì cho lần sau…"
              className="mt-2 box-border min-h-24 w-full resize-y rounded-lg border border-lms-line bg-lms-surface p-3 font-sans text-[13.5px] leading-relaxed text-lms-ink outline-none" />
            {saveError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-lms-danger/30 bg-lms-danger/8 p-3">
                <Icon name="x" size={16} stroke={p.danger} />
                <div className="text-[12.5px] leading-normal text-lms-ink">{saveError}</div>
              </div>
            )}
            <Btn p={p} icon="check" full className="mt-3" onClick={saveSelf}>
              {savingSelf ? 'Đang lưu…' : savedSelf ? 'Đã lưu ✓' : 'Lưu tự đánh giá'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function useMyAttempts() {
  useLMS();
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mine: any[] = await attemptsApi.mine();
        if (!alive) return;
        setRows(Array.isArray(mine) ? mine : []);
      } catch {
        if (alive) setRows([]); /* unauthenticated or API error */
      }
    })();
    return () => { alive = false; };
  }, []);
  return React.useMemo(() => rows.map((a) => {
    const exId = String(a?.exerciseId?._id ?? a?.exerciseId ?? '');
    const ex = DB.STUDENT_TASKS.find((x) => x.id === exId)
      || (DB as any).ASSIGNMENTS?.find((x: any) => x.id === exId)
      || {};
    return {
      id: a._id,
      exerciseId: exId,
      title: ex.title || 'Bài tập',
      type: ex.type || '',
      points: ex.points ?? 10,
      status: a.status,
      score: typeof a.totalScore === 'number' ? a.totalScore : null,
      percent: typeof a.percent === 'number' ? a.percent : null,
      submittedAt: a.submittedAt ?? null,
    };
  }), [rows]);
}

export function SResults({ p, t }) {
  const attempts = useMyAttempts();
  const [open, setOpen] = React.useState(0);

  const graded = attempts.filter((a) => a.status === 'graded' && a.score != null);
  const pcts = graded
    .map((a) => (a.percent != null ? a.percent : a.points ? Math.round((a.score / a.points) * 100) : null))
    .filter((x): x is number => x != null);
  const avgPct = pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : null;
  const avgScore = graded.length
    ? Math.round((graded.reduce((s, a) => s + a.score, 0) / graded.length) * 10) / 10
    : null;
  const trend = [...graded].reverse().map((a) => a.score).slice(-6);

  if (graded.length === 0) {
    return (
      <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
        <EmptyState p={p} icon="award" label="Chưa có kết quả đã chấm" sub="Khi bài của bạn được chấm, điểm và nhận xét sẽ hiện ở đây." />
      </div>
    );
  }

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-6 flex flex-wrap gap-4">
        {avgScore != null && (
          <div className={`${cardClass(20)} flex flex-1 items-center gap-4 p-[22px]`}>
            <Ring value={avgPct ?? 0} size={62} thickness={7} p={p} color={p.accent} label={avgScore.toFixed(1)} />
            <div><div className="text-[13px] text-lms-sub">Điểm trung bình</div>
              <div className="font-lms-heading text-[22px] font-semibold text-lms-ink">
                {avgScore >= 8 ? 'Rất tốt' : avgScore >= 6.5 ? 'Khá tốt' : 'Cần cố gắng'}
              </div></div>
          </div>
        )}
        {trend.length >= 2 && (
          <div className={`${cardClass(20)} flex-1 p-[22px]`}>
            <div className="mb-2.5 text-[12.5px] text-lms-sub">Tiến triển {trend.length} bài gần nhất</div>
            <Spark data={trend} w={200} h={40} stroke={p.accent} fill={p.accentSoft} sw={2.2} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {graded.map((g, i) => (
          <div key={g.id} className={`${cardClass(20)} overflow-hidden p-0`}>
            <div onClick={() => setOpen(open === i ? -1 : i)} className="lms-row flex cursor-pointer items-center gap-4 px-5 py-4">
              <div className="flex-1"><div className="text-[14.5px] font-semibold text-lms-ink">{g.title}</div>
                <div className="mt-[3px] text-xs text-lms-faint">{[g.type, g.percent != null ? `${g.percent}% đúng` : null].filter(Boolean).join(' · ')}</div></div>
              <span className={`font-lms-heading text-[26px] font-semibold ${g.score >= 8 ? 'text-lms-ok' : 'text-lms-ink'}`}>{g.score}</span>
              <Icon name={open === i ? 'chevronDown' : 'chevronRight'} size={18} stroke={p.faint} />
            </div>
            {open === i && (
              <div className="border-t border-lms-line px-5 pb-5">
                <div className="mt-4 flex gap-3 rounded-xl border border-lms-line bg-lms-raise p-3.5">
                  <Icon name="checkCircle" size={20} stroke={p.ok} />
                  <div><div className="mb-[3px] text-xs font-semibold text-lms-ink">Kết quả</div>
                    <div className="text-[13px] leading-normal text-lms-sub">
                      Bạn đạt <strong className="text-lms-ink">{g.score}</strong>/{g.points} điểm
                      {g.percent != null ? ` (${g.percent}% câu đúng).` : '.'}
                    </div></div>
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
        <div className="lms-stagger mb-[34px] grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
          {downloaded.map((d) => {
            const m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift cursor-pointer overflow-hidden border border-lms-line bg-lms-surface">
                <div className="relative flex h-[84px] items-center justify-center bg-lms-accent-soft">
                  <Icon name={m.icon} size={26} stroke={p.accent} sw={1.4} />
                  <span className="absolute top-2.5 left-2.5"><Tag p={p} color={p.ok}>Đã tải ✓</Tag></span>
                </div>
                <div className="p-3.5">
                  <div className="line-clamp-2 min-h-[34px] text-[13px] font-semibold wrap-break-word leading-snug text-lms-ink">{d.name}</div>
                  <div className="mt-2.5 truncate font-mono text-[11px] text-lms-faint">{d.folder} · {d.size}</div>
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
          {tasks.map((task) => <STaskRow key={task.id} task={task} p={p} />)}
        </div>
      )}
    </div>
  );
}
