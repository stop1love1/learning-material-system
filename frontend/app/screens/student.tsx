'use client';
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, Progress, Ring, Spark, EmptyState } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { filesApi, exercisesApi, attemptsApi, selfAssessmentsApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import { lblStyle, tStripe } from '@/app/helpers/shared';
import { DOC_TYPE_META, RubricMatrix } from '@/app/screens/resources';
import { DocCardMini } from '@/app/screens/teacher';
import { levelMeta, QuestionView } from '@/app/screens/bank';

function sCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }
function taskTone(p, s) { return { todo: p.accent, done: p.info, graded: p.ok }[s] || p.sub; }
function taskLabel(s) { return { todo: 'Cần làm', done: 'Đã nộp', graded: 'Đã chấm' }[s] || s; }

// ── Public home / landing — personal free-resource hub (bento + motion) ──────
export function UserHome({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const featured = DB.DOCS.slice(0, 6);
  const cats = DB.DOC_FOLDERS.filter((f) => f !== 'Tất cả');
  const exercise = DB.STUDENT_TASKS.find((x) => x.status === 'todo') || DB.STUDENT_TASKS[0];
  const lead = DB.ARTICLES[0];
  const heroDoc = DB.DOCS[0];
  const catIcons = ['book', 'docs', 'video', 'rubric', 'report', 'bulb', 'pen', 'star'];

  return (
    <div className="lms-content-pad" style={{ maxWidth: 1480, margin: '0 auto', padding: '28px 30px 8px' }}>
      {/* HERO BENTO */}
      <div className="bento" style={{ marginBottom: 16 }}>
        {/* feature */}
        <div className="col-8 row-2 reveal bento-tile" style={{ position: 'relative', overflow: 'hidden', padding: 38,
          background: `radial-gradient(120% 120% at 100% 0%, ${hexA(p.accent, p.dark ? 0.35 : 0.18)} 0%, ${p.surface} 55%)`,
          border: `1px solid ${p.line}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 320 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 20,
            background: p.surface, border: `1px solid ${p.line}`, fontSize: 11.5, fontWeight: 700, color: p.accent, marginBottom: 18 }}>
            <Icon name="flame" size={14} stroke={p.accent} /> TÀI NGUYÊN NGỮ VĂN · MIỄN PHÍ
          </span>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(30px, 4.4vw, 50px)', fontWeight: 800, color: p.ink, margin: 0, letterSpacing: -1.4, lineHeight: 1.04, maxWidth: 620 }}>
            Học Văn nhẹ nhàng,<br /><span style={{ color: p.accent }}>tài liệu mở</span> cho tất cả.
          </h1>
          <p style={{ fontSize: 16, color: p.sub, margin: '18px 0 24px', maxWidth: 480, lineHeight: 1.6 }}>
            Mình chia sẻ miễn phí kho tài liệu, đề thi, bài giảng và bài tập Ngữ văn Tiểu học — ai cũng có thể đọc, luyện tập và tải về.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setRoute('s-docs'); }} style={{ display: 'flex', gap: 10, maxWidth: 540, flexWrap: 'wrap' }}>
            <Field p={p} icon="search" value="" onChange={() => {}} placeholder="Tìm tài liệu, tác phẩm, chủ đề…" style={{ flex: 1, minWidth: 200, height: 50, borderRadius: 12 }} />
            <Btn p={p} size="lg" icon="arrowRight" onClick={() => setRoute('s-docs')} style={{ borderRadius: 12 }}>Khám phá</Btn>
          </form>
        </div>

        {/* provider / about */}
        <div className="col-4 reveal bento-tile hovlift" style={{ padding: 24, background: p.ink, border: `1px solid ${p.ink}`, color: p.surface, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: p.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 22, fontWeight: 700 }}>MA</div>
            <div><div style={{ fontSize: 15.5, fontWeight: 700 }}>Cô Mai Anh</div>
              <div style={{ fontSize: 12.5, opacity: 0.7 }}>Giáo viên Tiểu học</div></div>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.82, margin: 0 }}>
            “Mình tin học liệu tốt nên đến được với mọi người. Tất cả ở đây đều miễn phí.”
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <span style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,.12)' }}>10+ năm dạy Tiểu học</span>
            <span style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,.12)' }}>Chia sẻ mở</span>
          </div>
        </div>

        {/* stats */}
        <div className="col-4 reveal bento-tile hovlift" style={{ padding: 22, background: p.surface, border: `1px solid ${p.line}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[[DB.DOCS.length + '+', 'học liệu', 'book'], [DB.STUDENT_TASKS.length + '+', 'bài tập', 'assign'], [DB.ARTICLES.length + '', 'bài viết', 'docs'], ['100%', 'miễn phí', 'flame']].map(([v, l, ic], i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Icon name={ic} size={17} stroke={p.accent} />
              <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 800, color: p.ink, letterSpacing: -0.5, marginTop: 4 }}>{v}</div>
              <div style={{ fontSize: 11.5, color: p.faint }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECONDARY BENTO: featured doc · exercise · article */}
      <div className="bento" style={{ marginBottom: 40 }}>
        <div className="col-5 reveal bento-tile hovlift" onClick={() => go('s-doc', { doc: heroDoc.id })}
          style={{ overflow: 'hidden', border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${p.accent}, ${hexA(p.accent, 0.55)})`, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <Tag p={p} color="#fff" soft={false} style={{ border: '1px solid rgba(255,255,255,.5)', color: '#fff' }}>HỌC LIỆU NỔI BẬT</Tag>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: p.ink, lineHeight: 1.3 }}>{heroDoc.name}</div>
            <div style={{ fontSize: 12.5, color: p.faint, marginTop: 8 }}>{heroDoc.folder} · {heroDoc.size}</div>
          </div>
        </div>

        <div className="col-4 reveal bento-tile hovlift" onClick={() => go('s-task', { task: exercise.id })}
          style={{ padding: 24, border: `1px solid ${p.line}`, background: `linear-gradient(160deg, ${p.accentSoft}, ${p.surface} 80%)`, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: p.surface, border: `1px solid ${p.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="assign" size={21} stroke={p.accent} /></div>
          <div style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: 0.3, marginBottom: 6 }}>LUYỆN TẬP</div>
          <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 700, color: p.ink, lineHeight: 1.3 }}>{exercise.title}</div>
          <div style={{ fontSize: 12.5, color: p.sub, marginTop: 8 }}>{exercise.type} · {exercise.questions} câu</div>
          <div style={{ marginTop: 'auto', paddingTop: 16 }}><Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Làm thử ngay</Btn></div>
        </div>

        <div className="col-3 reveal bento-tile hovlift" onClick={() => go('article', { article: lead.id })}
          style={{ padding: 22, border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: p.accent, letterSpacing: 0.3, marginBottom: 10 }}>BÀI VIẾT MỚI</div>
          <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: p.ink, lineHeight: 1.3 }}>{lead.title}</div>
          <p style={{ fontSize: 12.5, color: p.sub, lineHeight: 1.55, margin: '10px 0 0' }}>{lead.excerpt}</p>
          <div style={{ marginTop: 'auto', paddingTop: 14, fontSize: 12, color: p.faint }}>{lead.read} đọc →</div>
        </div>
      </div>

      {/* categories */}
      <div className="reveal" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.6 }}>Khám phá theo chủ đề</h2>
        <span onClick={() => setRoute('s-docs')} style={{ fontSize: 13, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Tất cả →</span>
      </div>
      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 14, marginBottom: 40 }}>
        {cats.map((c, i) => (
          <div key={c} onClick={() => setRoute('s-docs')} className="bento-tile hovlift" style={{ padding: 18, border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name={catIcons[i % catIcons.length]} size={19} stroke={p.accent} /></div>
            <div style={{ fontSize: 14, fontWeight: 600, color: p.ink }}>{c}</div>
            <div style={{ fontSize: 11.5, color: p.faint, marginTop: 3 }}>{DB.DOCS.filter((d) => d.folder === c).length} học liệu</div>
          </div>
        ))}
      </div>

      {/* featured materials */}
      <div className="reveal" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.6 }}>Học liệu nổi bật</h2>
        <span onClick={() => setRoute('s-docs')} style={{ fontSize: 13, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Xem thêm →</span>
      </div>
      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 16, marginBottom: 44 }}>
        {featured.map((d) => {
          const m = DOC_TYPE_META[d.type];
          return (
            <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift" style={{ overflow: 'hidden', border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer' }}>
              <div style={{ height: 92, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Icon name={m.icon} size={28} stroke={p.accent} sw={1.4} />
                <span style={{ position: 'absolute', top: 10, left: 10 }}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink, lineHeight: 1.35, minHeight: 36 }}>{d.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 10 }}>{d.folder} · {d.size}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* latest articles */}
      <div className="reveal" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.6 }}>Bài viết mới nhất</h2>
        <span onClick={() => setRoute('blog')} style={{ fontSize: 13, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Tất cả bài viết →</span>
      </div>
      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16, paddingBottom: 8 }}>
        {DB.ARTICLES.slice(0, 3).map((a) => (
          <div key={a.id} onClick={() => go('article', { article: a.id })} className="bento-tile hovlift" style={{ padding: 20, border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer' }}>
            <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 6, background: p.accentSoft, color: p.accent, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>{a.cat}</span>
            <h3 style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, margin: 0, color: p.ink, lineHeight: 1.3 }}>{a.title}</h3>
            <p style={{ fontSize: 13, color: p.sub, lineHeight: 1.55, margin: '8px 0 12px' }}>{a.excerpt}</p>
            <div style={{ fontSize: 11.5, color: p.faint }}>{a.author} · {a.read} đọc</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Student overview ─────────────────────────────────────────────────────────
export function SOverview({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const todo = DB.STUDENT_TASKS.filter((x) => x.status === 'todo');
  const graded = DB.STUDENT_TASKS.filter((x) => x.status === 'graded' || (x.status === 'done' && x.score));
  return (
    <div style={{ padding: '30px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 26, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 1, color: p.faint, marginBottom: 10 }}>THỨ HAI · 22 THÁNG 6, 2026</div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, color: p.ink, margin: 0, letterSpacing: -0.6, lineHeight: 1.05 }}>
            Chào bạn, <span style={{ color: p.accent }}>Thu Hà.</span>
          </h2>
          <p style={{ fontSize: 14.5, color: p.sub, margin: '12px 0 0', maxWidth: 480, lineHeight: 1.5 }}>
            Bạn có <strong style={{ color: p.ink }}>3 bài tập</strong> cần hoàn thành, trong đó <strong style={{ color: p.ink }}>1 bài đến hạn hôm nay</strong>.
          </p>
        </div>
        <div style={{ ...sCard(p, 20), display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring value={84} size={64} thickness={7} p={p} color={p.accent} label="8,4" />
          <div><div style={{ fontSize: 13, color: p.sub }}>Điểm trung bình</div>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: p.ink, marginTop: 2 }}>Xếp hạng 3/28</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>
        <section style={sCard(p)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Bài cần làm</h3>
            <span onClick={() => setRoute('s-tasks')} style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.accent, cursor: 'pointer' }}>Tất cả →</span>
          </div>
          {todo.map((task, i) => (
            <div key={task.id} onClick={() => go('s-task', { task: task.id })} className="lms-row"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="assign" size={20} stroke={p.accent} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                <div style={{ fontSize: 12, color: p.faint, marginTop: 2 }}>{task.type} · {task.questions} câu</div>
              </div>
              <Tag p={p} color={task.dueIn === 'Hôm nay' ? p.danger : p.sub}>{task.dueIn}</Tag>
              <Btn p={p} variant="soft" size="sm">Làm bài</Btn>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section style={{ borderRadius: 12, padding: 22, border: `1px solid ${p.line}`, background: `linear-gradient(135deg, ${p.accentSoft}, ${p.surface} 70%)` }}>
            <Icon name="book" size={22} stroke={p.accent} />
            <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, margin: '12px 0 6px', color: p.ink }}>Kho tài liệu</h3>
            <p style={{ fontSize: 13, color: p.sub, margin: '0 0 16px', lineHeight: 1.5 }}>Tìm tài liệu, đề thi, sơ đồ tư duy để đọc và ôn tập.</p>
            <Btn p={p} icon="search" full onClick={() => setRoute('s-docs')}>Khám phá học liệu</Btn>
          </section>
          <section style={sCard(p)}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Kết quả gần đây</h3>
            {graded.map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                  <div style={{ fontSize: 11, color: p.faint, marginTop: 2 }}>{g.type} · {g.questions} câu</div>
                </div>
                <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: g.score >= 8 ? p.ok : p.ink }}>{g.score}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Student classes ──────────────────────────────────────────────────────────
export function SClasses({ p, t, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const mine = DB.CLASSES.filter((c) => ['c1', 'c2'].includes(c.id));
  return (
    <div style={{ padding: '26px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 18 }}>
        {mine.map((c) => {
          const hue = tStripe(p, c.color);
          return (
            <div key={c.id} onClick={() => go('s-class', { class: c.id })} className="lms-card" style={{ ...sCard(p, 0), overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 80, background: hexA(hue, p.dark ? 0.22 : 0.12), display: 'flex', alignItems: 'flex-end', padding: 16, position: 'relative' }}>
                <span style={{ position: 'absolute', top: 14, left: 16, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: hue }}>{c.code}</span>
              </div>
              <div style={{ padding: 18 }}>
                <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, margin: 0, color: p.ink }}>{c.name}</h3>
                <div style={{ fontSize: 12.5, color: p.sub, marginTop: 8 }}>{c.teacher} · {c.schedule}</div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: p.faint, marginBottom: 6 }}>
                  <span>Tiến độ lớp</span><span style={{ fontFamily: FONTS.mono }}>{c.progress}%</span></div>
                <Progress p={p} value={c.progress} color={hue} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Student class detail ─────────────────────────────────────────────────────
export function SClass({ p, t, ctx, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const c = DB.CLASSES.find((x) => x.id === ctx.class) || DB.CLASSES[0];
  const [tab, setTab] = React.useState('tasks');
  const hue = tStripe(p, c.color);
  const tasks = DB.STUDENT_TASKS.filter((x) => x.class === c.code);
  return (
    <div style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('s-classes')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Lớp của tôi
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
        <div style={{ width: 52, height: 52, borderRadius: 8, background: hexA(hue, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="class" size={24} stroke={hue} /></div>
        <div><div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: hue, fontWeight: 600 }}>{c.code}</div>
          <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, margin: '4px 0 0', color: p.ink }}>{c.name}</h2>
          <div style={{ fontSize: 12.5, color: p.sub, marginTop: 6 }}>{c.teacher} · {c.schedule} · Phòng {c.room}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${p.line}`, marginBottom: 22 }}>
        {[['tasks', 'Bài tập'], ['docs', 'Tài liệu'], ['notices', 'Thông báo']].map(([k, lab]) => {
          const on = tab === k;
          return <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 4px', marginRight: 20, border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: FONTS.sans, fontSize: 14, fontWeight: on ? 600 : 500, color: on ? p.ink : p.sub, borderBottom: `2px solid ${on ? p.accent : 'transparent'}`, marginBottom: -1 }}>{lab}</button>;
        })}
      </div>
      {tab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map((task) => <STaskRow key={task.id} task={task} p={p} go={go} />)}
        </div>
      )}
      {tab === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
          {DB.DOCS.slice(0, 4).map((d) => <DocCardMini key={d.id} d={d} p={p} />)}
        </div>
      )}
      {tab === 'notices' && (
        <div style={sCard(p)}>
          {DB.NOTICES.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: p.sink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={n.icon} size={16} stroke={p.sub} /></div>
              <div><div style={{ fontSize: 13.5, color: p.ink }}>{n.title}</div><div style={{ fontSize: 11, color: p.faint, marginTop: 3, fontFamily: FONTS.mono }}>{n.time}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function STaskRow({ task, p, go }) {
  const tone = taskTone(p, task.status);
  return (
    <div className="lms-card" onClick={() => task.status === 'todo' && go('s-task', { task: task.id })}
      style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: '16px 20px', cursor: task.status === 'todo' ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: hexA(tone, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={task.status === 'graded' ? 'checkCircle' : 'assign'} size={20} stroke={tone} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{task.title}</div>
        <div style={{ fontSize: 12, color: p.sub, marginTop: 4 }}>{[task.class || task.subject, task.type, task.due && `hạn ${task.due}`].filter(Boolean).join(' · ')}</div>
      </div>
      {task.score != null
        ? <div style={{ textAlign: 'center' }}><div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: p.ok }}>{task.score}</div><div style={{ fontSize: 10, color: p.faint }}>/{task.points}</div></div>
        : <Tag p={p} color={tone}>{task.dueIn}</Tag>}
      {task.status === 'todo' ? <Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Làm bài</Btn> : <Tag p={p} color={taskTone(p, task.status)}>{taskLabel(task.status)}</Tag>}
    </div>
  );
}

// ── Student tasks list ───────────────────────────────────────────────────────
export function STasks({ p, t, go }) {
  const [f, setF] = React.useState('todo');
  const list = DB.STUDENT_TASKS.filter((x) => f === 'all' ? true : f === 'done' ? x.status !== 'todo' : x.status === 'todo');
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        <Pill p={p} active={f === 'todo'} onClick={() => setF('todo')}>Cần làm</Pill>
        <Pill p={p} active={f === 'done'} onClick={() => setF('done')}>Đã nộp & chấm</Pill>
        <Pill p={p} active={f === 'all'} onClick={() => setF('all')}>Tất cả</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((task) => <STaskRow key={task.id} task={task} p={p} go={go} />)}
      </div>
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

// ── Student: do an assignment ────────────────────────────────────────────────
export function STask({ p, t, ctx, setRoute, auth }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const task = DB.STUDENT_TASKS.find((x) => x.id === ctx.task) || DB.STUDENT_TASKS[0];

  // ── All hooks first (Rules of Hooks): never declared behind an early return. ──
  const [liveQs, setLiveQs] = React.useState(null);
  const [exType, setExType] = React.useState(null); // backend type: 'quiz'|'essay'|'file'
  const [cur, setCur] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null); // { score, total, percent, graded }
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

  // Conditional returns are safe below — all hooks have already run.
  if (auth && !auth.loggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 30, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="logout" size={28} stroke={p.accent} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.5 }}>Đăng nhập để làm bài</h2>
        <p style={{ fontSize: 14.5, color: p.sub, margin: '12px 0 24px', maxWidth: 420, lineHeight: 1.6 }}>
          Làm bài tập và xem <strong style={{ color: p.ink }}>phiếu học tập</strong> cần đăng nhập. Việc duyệt và đọc học liệu thì hoàn toàn tự do.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} size="lg" icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" size="lg" onClick={() => setRoute('s-tasks')}>Quay lại</Btn>
        </div>
      </div>
    );
  }
  if (!task) return null;

  // Mock fallback questions (used when the live fetch yields nothing).
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
      // Offline / logged-out / no live questions → mock submit, then exit.
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

  // Result screen (shown after a successful live submit).
  if (result) {
    const pct = result.percent != null
      ? result.percent
      : (result.total ? Math.round((result.correct / result.total) * 100) : 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 30, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Icon name={result.graded ? 'checkCircle' : 'send'} size={32} stroke={p.accent} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.5 }}>Đã nộp bài!</h2>
        <p style={{ fontSize: 14.5, color: p.sub, margin: '10px 0 22px', maxWidth: 420, lineHeight: 1.6 }}>
          {result.graded
            ? 'Bài của bạn đã được chấm.'
            : result.waiting
            ? 'Bài đã nộp. Phần tự luận đang chờ giáo viên chấm.'
            : 'Bài của bạn đã được ghi nhận.'}
        </p>
        <div style={{ display: 'flex', gap: 22, marginBottom: 26 }}>
          <div style={{ ...sCard(p, 18), minWidth: 120 }}>
            <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 800, color: result.score != null && result.score >= (task.points || 10) * 0.8 ? p.ok : p.ink }}>
              {result.score != null ? result.score : `${result.correct}/${result.total}`}
            </div>
            <div style={{ fontSize: 12, color: p.faint, marginTop: 4 }}>{result.score != null ? `điểm / ${task.points}` : 'câu đúng'}</div>
          </div>
          <div style={{ ...sCard(p, 18), minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ring value={pct} size={56} thickness={6} p={p} color={p.accent} label={`${pct}%`} />
            <div style={{ fontSize: 12, color: p.faint }}>tỉ lệ đúng</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 30, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Icon name="assign" size={28} stroke={p.accent} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 800, margin: 0, color: p.ink }}>Bài tập chưa có câu hỏi</h2>
        <p style={{ fontSize: 14, color: p.sub, margin: '10px 0 22px', maxWidth: 400, lineHeight: 1.6 }}>Bài này hiện chưa có câu hỏi nào để làm. Hãy quay lại sau nhé.</p>
        <Btn p={p} icon="arrowLeft" onClick={() => setRoute('s-tasks')}>Về danh sách bài</Btn>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 30px', borderBottom: `1px solid ${p.line}`, flexShrink: 0 }}>
        <div onClick={() => setRoute('s-tasks')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer' }}>
          <Icon name="x" size={16} stroke={p.sub} /> Thoát
        </div>
        <div style={{ width: 1, height: 26, background: p.line }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: p.ink }}>{task.title}</div>
          <div style={{ fontSize: 12, color: p.faint }}>{task.type} · {task.points} điểm</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 10, border: `1px solid ${p.line}`, background: p.surface }}>
          <Icon name="clock" size={15} stroke={p.warn} /><span style={{ fontFamily: FONTS.mono, fontSize: 13, color: p.ink }}>28:14</span>
        </div>
      </div>

      <div className="lms-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* phiếu học tập đính kèm */}
          <div style={{ ...sCard(p, 16), marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ws ? 14 : 0 }}>
              <Icon name="docs" size={17} stroke={p.accent} />
              <span style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>Phiếu học tập</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {worksheets.map((w) => (
                  <button key={w.id} onClick={() => setWs(ws && ws.id === w.id ? null : w)} className="lms-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${ws && ws.id === w.id ? p.accent : p.line}`, background: ws && ws.id === w.id ? p.accentSoft : p.surface,
                      color: ws && ws.id === w.id ? p.accent : p.sub, fontFamily: FONTS.sans, fontSize: 12.5, fontWeight: 500 }}>
                    <Icon name="eye" size={14} stroke={ws && ws.id === w.id ? p.accent : p.faint} /> {w.name}
                  </button>
                ))}
              </div>
            </div>
            {ws && (
              <div style={{ padding: 18, borderRadius: 8, background: p.raise, border: `1px solid ${p.line}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: p.ink, marginBottom: 10 }}>{ws.name}</div>
                {DOC_BODY.slice(0, 3).map((para, i) => (
                  <p key={i} style={{ fontSize: 13.5, lineHeight: 1.8, color: p.sub, margin: '0 0 10px', textWrap: 'pretty' }}>{para}</p>
                ))}
                <Btn p={p} variant="ghost" size="sm" icon="download">Tải phiếu</Btn>
              </div>
            )}
          </div>
          {!essay && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {qs.map((_, i) => (
                <button key={i} onClick={() => setCur(i)} style={{ width: 38, height: 38, borderRadius: 10, cursor: 'pointer', fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${i === cur2 ? p.accent : answers[qs[i].id] ? p.ok : p.line}`,
                  background: i === cur2 ? p.accentSoft : answers[qs[i].id] ? hexA(p.ok, 0.08) : p.surface,
                  color: i === cur2 ? p.accent : answers[qs[i].id] ? p.ok : p.sub }}>{i + 1}</button>
              ))}
            </div>
          )}
          <div style={{ ...sCard(p, 28) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Tag p={p} color={p.accent}>{essay ? 'Tự luận' : `Câu ${cur2 + 1}/${qs.length}`}</Tag>
              <Tag p={p} color={levelMeta(q.level).color}>{levelMeta(q.level).label}</Tag>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: p.ink, lineHeight: 1.5, marginBottom: 22 }}>{q.stem}</div>
            <QuestionView q={q} p={p} mode="do" answer={answers[q.id]} onAnswer={(v) => setAnswers({ ...answers, [q.id]: v })} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
            {!essay && <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => setCur(Math.max(0, cur2 - 1))}>Câu trước</Btn>}
            <div style={{ flex: 1, fontSize: 12.5, color: p.faint, textAlign: 'center', fontFamily: FONTS.mono }}>
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

// Strip HTML tags + decode common entities → plain text (for card previews).
const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// ── Student library (searchable) ─────────────────────────────────────────────
export function SDocs({ p, t, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [q, setQ] = React.useState('');
  const [folder, setFolder] = React.useState('Tất cả');
  const list = DB.DOCS.filter((d) => (folder === 'Tất cả' || d.folder === folder)
    && (!q || (d.name + ' ' + d.folder).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="lms-content-pad" style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      {/* hero search */}
      <div className="reveal" style={{ borderRadius: 18, padding: '34px 30px', marginBottom: 22, border: `1px solid ${p.line}`,
        background: `radial-gradient(120% 130% at 100% 0%, ${hexA(p.accent, p.dark ? 0.3 : 0.16)} 0%, ${p.surface} 58%)` }}>
        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, margin: 0, color: p.ink, letterSpacing: -0.4 }}>
          Kho tài liệu <span style={{ color: p.accent }}>Ngữ văn</span>
        </h2>
        <p style={{ fontSize: 14, color: p.sub, margin: '8px 0 18px', maxWidth: 520, lineHeight: 1.5 }}>
          Tìm tài liệu, đề thi, sơ đồ tư duy và bài giảng để đọc, ôn tập và làm bài.
        </p>
        <div style={{ maxWidth: 560 }}>
          <Field p={p} icon="search" value={q} onChange={setQ} placeholder="Tìm theo tên tài liệu, chủ đề…" style={{ height: 46 }} />
        </div>
      </div>

      {/* subject chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DB.DOC_FOLDERS.map((f) => {
          const n = f === 'Tất cả' ? DB.DOCS.length : DB.DOCS.filter((d) => d.folder === f).length;
          return <Pill key={f} p={p} active={f === folder} onClick={() => setFolder(f)}>{f}{f !== 'Tất cả' ? ` · ${n}` : ` · ${n}`}</Pill>;
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState p={p} icon="search" label="Không tìm thấy học liệu" sub="Thử từ khoá khác hoặc chọn chủ đề khác." />
      ) : (
        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {list.map((d) => {
            const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift" style={{ overflow: 'hidden', border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer' }}>
                <div style={{ height: 96, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <Icon name={m.icon} size={30} stroke={p.accent} sw={1.4} />
                  {d.thumb && <img src={d.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, borderRadius: 7, background: d.thumb ? 'rgba(255,255,255,.92)' : 'transparent', backdropFilter: d.thumb ? 'blur(4px)' : undefined, boxShadow: d.thumb ? '0 1px 3px rgba(0,0,0,.12)' : undefined }}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                  <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, borderRadius: 7, background: d.thumb ? 'rgba(255,255,255,.92)' : 'transparent', backdropFilter: d.thumb ? 'blur(4px)' : undefined, boxShadow: d.thumb ? '0 1px 3px rgba(0,0,0,.12)' : undefined }}><Tag p={p} color={p.sub}>{d.folder}</Tag></span>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink, lineHeight: 1.35, minHeight: 36 }}>{d.name}</div>
                  {d.desc && <div style={{ fontSize: 11.5, color: p.sub, lineHeight: 1.45, marginTop: 6, maxHeight: 34, overflow: 'hidden' }}>{stripHtml(d.desc).slice(0, 110)}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{d.size} · ↓ {d.downloads}</span>
                    <Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Đọc</Btn>
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

// ── Student: read a material ─────────────────────────────────────────────────
const DOC_BODY = [
  'Tài liệu này tổng hợp những nội dung trọng tâm, được biên soạn bám sát chương trình Tiếng Việt Tiểu học hiện hành.',
  'Phần đầu giới thiệu khái quát bài học, kèm sơ đồ hệ thống ý đơn giản, nhiều màu sắc để các em dễ ghi nhớ.',
  'Phần thân hướng dẫn từng bước, có ví dụ minh hoạ gần gũi và gợi ý cách viết đoạn văn theo cấu trúc mở — thân — kết.',
  'Cuối tài liệu là bộ câu hỏi tự luyện kèm đáp án, giúp các em tự kiểm tra mức độ nắm bài trước khi làm bài tập trên hệ thống.',
];
// inline media block: video/audio play directly; user can upload a real file to play
function MediaBlock({ d, p, m }) {
  const [url, setUrl] = React.useState(null);
  const [name, setName] = React.useState('');
  const inputRef = React.useRef(null);
  const isVideo = d.type === 'video', isAudio = d.type === 'audio';
  const onPick = (e) => { const f = e.target.files && e.target.files[0]; if (f) { setUrl(URL.createObjectURL(f)); setName(f.name); } };
  if (!isVideo && !isAudio) {
    return (
      <div style={{ height: 200, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Icon name={m.icon} size={56} stroke={p.accent} sw={1.2} />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 24 }}>
      {url ? (
        isVideo
          ? <video src={url} controls style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 380 }} />
          : <div style={{ padding: 20, borderRadius: 10, background: p.accentSoft }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Icon name="play" size={18} stroke={p.accent} /><span style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>{name}</span></div>
              <audio src={url} controls style={{ width: '100%' }} />
            </div>
      ) : (
        <div onClick={() => inputRef.current && inputRef.current.click()} className="lms-row"
          style={{ height: 200, borderRadius: 10, border: `1.5px dashed ${p.line}`, background: p.raise, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={isVideo ? 'video' : 'play'} size={24} stroke={p.accent} /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: p.ink }}>{isVideo ? 'Tải video lên để xem trực tiếp' : 'Tải audio lên để nghe trực tiếp'}</div>
          <div style={{ fontSize: 12, color: p.faint }}>Bấm để chọn tệp {isVideo ? 'video' : 'âm thanh'} từ máy của bạn</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={isVideo ? 'video/*' : 'audio/*'} onChange={onPick} style={{ display: 'none' }} />
      {url && <div style={{ marginTop: 10 }}><Btn p={p} variant="ghost" size="sm" icon="upload" onClick={() => inputRef.current && inputRef.current.click()}>Đổi tệp khác</Btn></div>}
    </div>
  );
}
export function SDocReader({ p, t, ctx, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const d = DB.DOCS.find((x) => x.id === ctx.doc) || DB.DOCS[0];
  const m = DOC_TYPE_META[d.type] || DOC_TYPE_META.doc;
  const related = DB.DOCS.filter((x) => x.folder === d.folder && x.id !== d.id).slice(0, 4);
  return (
    <div className="lms-content-pad" style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('s-docs')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Kho tài liệu
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={m.icon} size={26} stroke={p.accent} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><Tag p={p} color={p.accent}>{m.label}</Tag><Tag p={p} color={p.sub}>{d.folder}</Tag></div>
          <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, margin: 0, color: p.ink, letterSpacing: -0.3, lineHeight: 1.2 }}>{d.name}</h2>
          <div style={{ fontSize: 12.5, color: p.faint, marginTop: 6 }}>{d.by} · cập nhật {d.updated} · {d.size} · ↓ {d.downloads} lượt tải</div>
        </div>
        {(DB.DOWNLOADS || []).includes(d.id)
          ? <Btn p={p} variant="soft" icon="check">Đã tải</Btn>
          : <Btn p={p} icon="download" onClick={async () => {
              try {
                await filesApi.download(d.id); // real download: $inc count + upsert Download row
                if (d.url) window.open(d.url, '_blank');
                await hydrateFor('s-doc'); // refresh DB.DOWNLOADS so the button flips to "Đã tải"
              } catch {
                LMS && LMS.download(d.id); // logged-out (401) / API down → mock fallback
              }
            }}>Tải về</Btn>}
      </div>

      {(() => {
        const preview = d.url ? d.url.replace(/\/view.*$/, '/preview') : '';
        return preview ? (
          <div style={{ ...sCard(p, 0), marginBottom: 18, overflow: 'hidden' }}>
            <iframe src={preview} title={d.name} style={{ width: '100%', height: 600, border: 'none', display: 'block', background: p.raise }} allow="autoplay" />
          </div>
        ) : (
          <div style={{ ...sCard(p, 30), marginBottom: 18 }}><MediaBlock d={d} p={p} m={m} /></div>
        );
      })()}
      <div style={{ ...sCard(p, 30), marginBottom: 22 }}>
        {d.desc
          ? <div className="lms-rich" style={{ fontSize: 15.5, lineHeight: 1.9, color: p.ink }} dangerouslySetInnerHTML={{ __html: d.desc }} />
          : <p style={{ fontSize: 15.5, lineHeight: 1.9, color: p.sub, margin: 0 }}>Tài liệu được chia sẻ từ kho học liệu Ngữ văn. Bấm “Mở trên Google Drive” để xem bản đầy đủ.</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Btn p={p} variant="soft" icon="assign" onClick={() => setRoute('s-tasks')}>Làm bài tập liên quan</Btn>
          <Btn p={p} variant="ghost" icon="rubric" onClick={() => setRoute('s-selfcheck')}>Tự đánh giá</Btn>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: '0 0 14px', color: p.ink }}>Học liệu liên quan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
            {related.map((r) => {
              const rm = DOC_TYPE_META[r.type] || DOC_TYPE_META.doc;
              return (
                <div key={r.id} onClick={() => go('s-doc', { doc: r.id })} className="lms-card lms-row" style={{ ...sCard(p, 14), display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={rm.icon} size={18} stroke={p.accent} /></div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: p.ink, lineHeight: 1.3 }}>{r.name}</div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: p.faint, marginTop: 2 }}>{rm.label}</div></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Student self-assessment (rubric) ─────────────────────────────────────────
export function SSelfCheck({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
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
    let sum = 0, any = false;
    rubric.criteria.forEach((c, ci) => { if (sel[ci] != null) { any = true; sum += c.weight * rubric.scale[sel[ci]].pct / 100; } });
    return any ? Math.round((sum / 10) * 10) / 10 : null;
  }, [sel, rubric]);
  React.useEffect(() => { setSel({}); setNote(''); setSavedSelf(false); }, [workId]);

  async function saveSelf() {
    if (savingSelf) return;
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

  return (
    <div className="lms-content-pad" style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ ...sCard(p, 18), marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', background: p.accentSoft, border: `1px solid ${hexA(p.accent, 0.3)}` }}>
        <Icon name="bulb" size={20} stroke={p.accent} />
        <div style={{ fontSize: 13.5, color: p.ink, lineHeight: 1.5 }}>
          Tự đánh giá giúp bạn nhìn lại bài làm theo từng tiêu chí trước khi nộp. Chọn mức phù hợp ở mỗi tiêu chí để xem điểm tự chấm.
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={lblStyle(p)}>CHỌN BÀI ĐỂ TỰ ĐÁNH GIÁ</label>
        <Select p={p} value={workId} onChange={setWorkId} style={{ marginTop: 8, maxWidth: 460 }}
          options={works.map((w) => ({ value: w.id, label: w.title }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        <section style={sCard(p, 20)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, margin: 0, color: p.ink }}>{rubric.name}</h3>
            <Tag p={p} color={p.accent}>{Object.keys(sel).length}/{rubric.criteria.length} tiêu chí</Tag>
          </div>
          <div className="lms-scrollx">
            <RubricMatrix rubric={rubric} p={p} mode="grade" selected={sel} onSelect={(ci, si) => setSel({ ...sel, [ci]: si })} />
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...sCard(p, 20), display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring value={selfScore ? (selfScore / 10) * 100 : 0} size={64} thickness={7} p={p} color={p.accent} label={selfScore != null ? selfScore.toFixed(1) : '—'} />
            <div>
              <div style={{ fontSize: 12.5, color: p.sub }}>Điểm tự chấm (thang 10)</div>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: p.ink, marginTop: 2 }}>
                {selfScore == null ? 'Chưa đánh giá' : selfScore >= 8 ? 'Rất tốt' : selfScore >= 6.5 ? 'Khá' : 'Cần cải thiện'}
              </div>
            </div>
          </div>
          <div style={sCard(p, 20)}>
            <label style={lblStyle(p)}>GHI CHÚ RÚT KINH NGHIỆM</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mình cần cải thiện điều gì cho lần sau…"
              style={{ width: '100%', minHeight: 96, marginTop: 8, padding: 12, borderRadius: 8, border: `1px solid ${p.line}`, background: p.surface,
                color: p.ink, fontFamily: FONTS.sans, fontSize: 13.5, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            <Btn p={p} icon="check" full style={{ marginTop: 12 }} onClick={saveSelf}>
              {savingSelf ? 'Đang lưu…' : savedSelf ? 'Đã lưu ✓' : 'Lưu tự đánh giá'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student results ──────────────────────────────────────────────────────────
export function SResults({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
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
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ ...sCard(p, 22), flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring value={84} size={62} thickness={7} p={p} color={p.accent} label="8,4" />
          <div><div style={{ fontSize: 13, color: p.sub }}>Điểm trung bình</div><div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: p.ink }}>Khá tốt</div></div>
        </div>
        <div style={{ ...sCard(p, 22), flex: 1 }}>
          <div style={{ fontSize: 12.5, color: p.sub, marginBottom: 10 }}>Tiến triển 6 bài gần nhất</div>
          <Spark data={[7, 7.5, 8, 7.8, 8.5, 9]} w={200} h={40} stroke={p.accent} fill={p.accentSoft} sw={2.2} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {graded.map((g, i) => (
          <div key={i} style={{ ...sCard(p, 0), overflow: 'hidden' }}>
            <div onClick={() => setOpen(open === i ? -1 : i)} className="lms-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{g.title}</div>
                <div style={{ fontSize: 12, color: p.faint, marginTop: 3 }}>{g.class}{g.rubric ? ' · chấm theo rubric' : ''}</div></div>
              <span style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: g.score >= 8 ? p.ok : p.ink }}>{g.score}</span>
              <Icon name={open === i ? 'chevronDown' : 'chevronRight'} size={18} stroke={p.faint} />
            </div>
            {open === i && (
              <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${p.line}` }}>
                {g.rubric && <div style={{ margin: '16px 0' }}><RubricMatrix rubric={rubric} p={p} mode="grade" selected={{ 0: 0, 1: 1, 2: 1, 3: 0 }} /></div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 16, padding: 14, borderRadius: 12, background: p.raise, border: `1px solid ${p.line}` }}>
                  <Avatar name="Cô Mai Anh" p={p} size={36} accent />
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: p.ink, marginBottom: 3 }}>Nhận xét của giáo viên</div>
                    <div style={{ fontSize: 13, color: p.sub, lineHeight: 1.5 }}>{g.fb}</div></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── My library (logged-in): downloaded resources + completed exercises ───────
export function SLibrary({ p, t, setRoute, go, auth }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  if (auth && !auth.loggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 30, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="star" size={28} stroke={p.accent} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.5 }}>Đăng nhập để xem “Của tôi”</h2>
        <p style={{ fontSize: 14.5, color: p.sub, margin: '12px 0 24px', maxWidth: 440, lineHeight: 1.6 }}>
          Sau khi đăng nhập, bạn sẽ thấy <strong style={{ color: p.ink }}>tài liệu đã tải</strong> và <strong style={{ color: p.ink }}>bài tập đã làm</strong> ở đây. Việc duyệt và đọc học liệu thì luôn miễn phí.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} size="lg" icon="logout" onClick={() => auth.open()}>Đăng nhập</Btn>
          <Btn p={p} variant="ghost" size="lg" onClick={() => setRoute('s-docs')}>Khám phá học liệu</Btn>
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
    <div className="lms-content-pad" style={{ maxWidth: 1480, margin: '0 auto', padding: '28px 30px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar name={name} p={p} size={56} accent />
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: p.faint, marginBottom: 6 }}>KHÔNG GIAN CỦA TÔI</div>
          <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.6, lineHeight: 1 }}>
            Chào <span style={{ color: p.accent }}>{first}</span>, đây là kho của bạn.
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(([v, l, ic], i) => (
          <div key={i} style={{ ...sCard(p, 20), display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={ic} size={21} stroke={p.accent} /></div>
            <div><div style={{ fontFamily: serif, fontSize: 26, fontWeight: 800, color: p.ink, lineHeight: 1, letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: 12.5, color: p.faint, marginTop: 4 }}>{l}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: serif, fontSize: 21, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.4 }}>Tài liệu đã tải</h3>
        <span onClick={() => setRoute('s-docs')} style={{ fontSize: 13, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Tải thêm →</span>
      </div>
      {downloaded.length === 0 ? (
        <EmptyState p={p} icon="download" label="Chưa có tài liệu nào" sub="Tải tài liệu từ kho học liệu để lưu lại ở đây." action={<Btn p={p} variant="soft" size="sm" icon="search" onClick={() => setRoute('s-docs')} style={{ marginTop: 4 }}>Khám phá học liệu</Btn>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16, marginBottom: 34 }}>
          {downloaded.map((d) => {
            const m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => go('s-doc', { doc: d.id })} className="bento-tile hovlift" style={{ overflow: 'hidden', border: `1px solid ${p.line}`, background: p.surface, cursor: 'pointer' }}>
                <div style={{ height: 84, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Icon name={m.icon} size={26} stroke={p.accent} sw={1.4} />
                  <span style={{ position: 'absolute', top: 10, left: 10 }}><Tag p={p} color={p.ok}>Đã tải ✓</Tag></span>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, lineHeight: 1.35, minHeight: 34 }}>{d.name}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 10 }}>{d.folder} · {d.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '6px 0 14px' }}>
        <h3 style={{ fontFamily: serif, fontSize: 21, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.4 }}>Bài tập đã làm</h3>
        <span onClick={() => setRoute('s-tasks')} style={{ fontSize: 13, color: p.accent, cursor: 'pointer', fontWeight: 600 }}>Tất cả →</span>
      </div>
      {tasks.length === 0 ? (
        <EmptyState p={p} icon="assign" label="Chưa làm bài nào" sub="Hãy thử một bài luyện tập để theo dõi tiến bộ của bạn." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map((task) => <STaskRow key={task.id} task={task} p={p} go={go} />)}
        </div>
      )}
    </div>
  );
}
