'use client';
import React from 'react';
import { Icon, Tag, Avatar, Btn, Field, Select, Progress, Segmented, Stat } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { tStripe, ACCENTS_REF } from '@/app/helpers/shared';

function tCard(p, pad = 22) {
  return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad };
}

function statusTone(p, s) {
  return { top: p.ok, good: p.info, risk: p.danger }[s] || p.sub;
}
function statusLabel(s) {
  return { top: 'Xuất sắc', good: 'Ổn định', risk: 'Cần hỗ trợ' }[s] || s;
}

// ── Teacher Overview ─────────────────────────────────────────────────────────
export function TOverview({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const ung = (aid) => DB.SUBMISSIONS.filter((s) => s.assignmentId === aid && s.status !== 'graded').length;
  const needGrading = DB.ASSIGNMENTS.filter((a) => ung(a.id) > 0);
  const shortcuts = [
    { icon: 'bank', label: 'Soạn câu hỏi', sub: 'Thêm vào ngân hàng', route: 'bank-edit' },
    { icon: 'docs', label: 'Tải tài liệu', sub: 'Lên kho học liệu', route: 'docs' },
    { icon: 'rubric', label: 'Tạo rubric', sub: 'Bộ tiêu chí mới', route: 'rubric-edit' },
    { icon: 'assign', label: 'Giao bài tập', sub: 'Phát cho lớp', route: 'assign-new' },
  ];
  return (
    <div style={{ padding: '30px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 26, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 1, color: p.faint, marginBottom: 10 }}>THỨ HAI · 22 THÁNG 6, 2026</div>
          <h2 style={{ fontFamily: serif, fontSize: 38, fontWeight: 500, color: p.ink, margin: 0, letterSpacing: -0.6, lineHeight: 1.05 }}>
            Chào buổi sáng, <span style={{ color: p.accent }}>Cô Mai Anh.</span>
          </h2>
          <p style={{ fontSize: 14.5, color: p.sub, margin: '12px 0 0', maxWidth: 520, lineHeight: 1.5 }}>
            Hôm nay có <strong style={{ color: p.ink }}>3 buổi dạy</strong> và <strong style={{ color: p.ink }}>19 bài tập</strong> đang chờ chấm. Cùng bắt đầu một ngày hiệu quả nhé!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
          <Btn p={p} variant="ghost" icon="book" onClick={() => setRoute('docs')}>Kho tài liệu</Btn>
        </div>
      </div>

      <div className="lms-statstrip" style={{ display: 'flex', ...tCard(p, 0), padding: '22px 0', marginBottom: 24 }}>
        {[
          { l: 'Học viên đang dạy', v: '95', d: '4 lớp', sp: [8, 10, 9, 12, 11, 14, 13, 16] },
          { l: 'Bài tập đang mở', v: '4', d: '2 sắp đến hạn', sp: [5, 6, 6, 7, 9, 8, 10, 11] },
          { l: 'Bài chờ chấm', v: '19', d: 'Cần xử lý', sp: [12, 9, 14, 11, 16, 13, 18, 19] },
          { l: 'Tỷ lệ nộp bài', v: '86', u: '%', d: '↑ 3,2%', up: true, sp: [7, 8, 8, 9, 9, 10, 11, 12] },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '0 26px', borderLeft: i ? `1px solid ${p.line}` : 'none' }}>
            <Stat p={p} label={s.l} value={s.v} unit={s.u} delta={s.d} up={s.up} spark={s.sp} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section style={tCard(p)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Bài cần chấm</h3>
              <span onClick={() => setRoute('grade')} style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.accent, cursor: 'pointer' }}>Xem tất cả →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {needGrading.length === 0 && <div style={{ fontSize: 13, color: p.faint, padding: '10px 0' }}>Tuyệt vời — không còn bài nào chờ chấm.</div>}
              {needGrading.map((a, i) => (
                <div key={a.id} onClick={() => go('grade-one', { assignment: a.id })} className="lms-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', cursor: 'pointer',
                    borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="grade" size={19} stroke={p.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: p.faint, marginTop: 2 }}>{a.class} · {a.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, color: p.accent, lineHeight: 1 }}>{ung(a.id)}</div>
                    <div style={{ fontSize: 10.5, color: p.faint, fontFamily: FONTS.mono, marginTop: 3 }}>chờ chấm</div>
                  </div>
                  <Icon name="chevronRight" size={18} stroke={p.faint} />
                </div>
              ))}
            </div>
          </section>

          <section style={tCard(p)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: 0, color: p.ink }}>Lịch hôm nay</h3>
              <Tag p={p} color={p.sub}>3 BUỔI</Tag>
            </div>
            {DB.SCHEDULE.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                <div style={{ width: 50, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 14, color: p.ink, fontWeight: 500 }}>{s.time}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: p.faint, marginTop: 2 }}>{s.dur}</div>
                </div>
                <div style={{ width: 1, background: p.line, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 4, left: -2.5, width: 6, height: 6, borderRadius: 3, background: i === 0 ? p.accent : p.faint }} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: p.sub, marginTop: 2 }}>{s.room} · {s.cls}</div>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <section style={tCard(p)}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Hoạt động</h3>
            {DB.NOTICES.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: p.sink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={n.icon} size={16} stroke={p.sub} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: p.ink, lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: p.faint, marginTop: 3, fontFamily: FONTS.mono }}>{n.time} · {n.tag}</div>
                </div>
              </div>
            ))}
          </section>

          <section style={tCard(p)}>
            <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: '0 0 16px', color: p.ink }}>Lối tắt</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {shortcuts.map((s) => (
                <div key={s.label} onClick={() => setRoute(s.route)} className="lms-row"
                  style={{ padding: 14, borderRadius: 12, border: `1px solid ${p.line}`, cursor: 'pointer', background: p.raise }}>
                  <Icon name={s.icon} size={19} stroke={p.accent} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, marginTop: 10 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: p.faint, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Class list ───────────────────────────────────────────────────────────────
export function TClasses({ p, t, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [view, setView] = React.useState(t.classView || 'grid');
  const [term, setTerm] = React.useState('all');
  return (
    <div style={{ padding: '26px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <Field p={p} icon="search" placeholder="Tìm lớp học…" style={{ width: 260 }} />
        <Select p={p} value={term} onChange={setTerm} style={{ width: 180 }}
          options={[{ value: 'all', label: 'Tất cả học kỳ' }, { value: 's', label: 'Học kỳ Hè 2026' }]} />
        <div style={{ flex: 1 }} />
        <Segmented p={p} value={view} onChange={setView} options={[{ value: 'grid', icon: 'grid' }, { value: 'list', icon: 'list' }]} />
        <Btn p={p} icon="plus">Tạo lớp</Btn>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
          {DB.CLASSES.map((c) => (
            <div key={c.id} onClick={() => go('class', { class: c.id })} className="lms-card"
              style={{ ...tCard(p, 0), overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 78, background: hexA(tStripe(p, c.color), p.dark ? 0.22 : 0.12), position: 'relative',
                borderBottom: `1px solid ${p.line}`, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                <span style={{ position: 'absolute', top: 14, left: 16, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5,
                  fontWeight: 600, color: tStripe(p, c.color) }}>{c.code}</span>
                {c.ungraded > 0 && <span style={{ position: 'absolute', top: 12, right: 12 }}><Tag p={p} color={p.accent}>{c.ungraded} CHỜ CHẤM</Tag></span>}
              </div>
              <div style={{ padding: 18 }}>
                <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, margin: 0, color: p.ink, lineHeight: 1.2 }}>{c.name}</h3>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: p.sub, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="students" size={14} stroke={p.faint} /> {c.students} học viên</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={14} stroke={p.faint} /> {c.schedule}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: p.faint, marginBottom: 6 }}>
                    <span>Tiến độ chương trình</span><span style={{ fontFamily: FONTS.mono, color: p.sub }}>{c.progress}%</span>
                  </div>
                  <Progress p={p} value={c.progress} color={tStripe(p, c.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={tCard(p, 0)}>
          {DB.CLASSES.map((c, i) => (
            <div key={c.id} onClick={() => go('class', { class: c.id })} className="lms-row"
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer',
                borderTop: i ? `1px solid ${p.line}` : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: hexA(tStripe(p, c.color), 0.14), display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}><Icon name="class" size={20} stroke={tStripe(p, c.color)} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{c.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.faint, marginTop: 2 }}>{c.code} · {c.schedule} · {c.room}</div>
              </div>
              <div style={{ width: 120 }}><Progress p={p} value={c.progress} color={tStripe(p, c.color)} /></div>
              <div style={{ width: 90, textAlign: 'center', fontSize: 13, color: p.sub }}>{c.students} HV</div>
              {c.ungraded > 0 ? <Tag p={p} color={p.accent}>{c.ungraded} chờ chấm</Tag> : <Tag p={p} color={p.ok}>Đã chấm xong</Tag>}
              <Icon name="chevronRight" size={18} stroke={p.faint} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Class detail ─────────────────────────────────────────────────────────────
export function TClassDetail({ p, t, ctx, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const c = DB.CLASSES.find((x) => x.id === ctx.class) || DB.CLASSES[0];
  const [tab, setTab] = React.useState('students');
  const hue = tStripe(p, c.color);
  const classAssignments = DB.ASSIGNMENTS.filter((a) => a.classId === c.id);
  return (
    <div style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('classes')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
        color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Lớp học
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: hexA(hue, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="class" size={26} stroke={hue} />
          </div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.5, color: hue, fontWeight: 600 }}>{c.code}</div>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, margin: '4px 0 0', color: p.ink, letterSpacing: -0.4 }}>{c.name}</h2>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12.5, color: p.sub, flexWrap: 'wrap' }}>
              <span>{c.term}</span><span>· {c.schedule}</span><span>· Phòng {c.room}</span><span>· {c.students} học viên</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn p={p} variant="ghost" icon="docs" onClick={() => setRoute('docs')}>Thêm tài liệu</Btn>
          <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${p.line}`, marginBottom: 22 }}>
        {[['students', 'Học viên', c.students], ['assignments', 'Bài tập', classAssignments.length], ['docs', 'Tài liệu', 6], ['notices', 'Thông báo', 4]].map(([k, lab, n]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 4px',
              marginRight: 18, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONTS.sans, fontSize: 14,
              fontWeight: on ? 600 : 500, color: on ? p.ink : p.sub, borderBottom: `2px solid ${on ? p.accent : 'transparent'}`, marginBottom: -1 }}>
              {lab} <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: on ? p.accent : p.faint, background: on ? p.accentSoft : p.sink, borderRadius: 10, padding: '1px 6px' }}>{n}</span>
            </button>
          );
        })}
      </div>

      {tab === 'students' && (
        <div className="lms-scrollx" style={tCard(p, 0)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${p.line}` }}>
            <Field p={p} icon="search" placeholder="Tìm học viên…" style={{ flex: 1, maxWidth: 280 }} />
            <div style={{ flex: 1 }} />
            <Btn p={p} variant="ghost" size="sm" icon="download">Xuất danh sách</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.4fr 1fr 1fr', padding: '11px 20px', borderBottom: `1px solid ${p.line}`,
            fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>
            <span>HỌC VIÊN</span><span>ĐIỂM TB</span><span>TIẾN ĐỘ NỘP</span><span>HOẠT ĐỘNG</span><span style={{ textAlign: 'right' }}>TRẠNG THÁI</span>
          </div>
          {DB.STUDENTS.map((s, i) => (
            <div key={s.id} className="lms-row" style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.4fr 1fr 1fr', alignItems: 'center',
              padding: '13px 20px', borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={s.name} p={p} size={36} accent={s.status === 'top'} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{s.name}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{s.code}</div>
                </div>
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 19, fontWeight: 600, color: s.avg >= 8 ? p.ok : s.avg < 6.5 ? p.danger : p.ink }}>{s.avg.toFixed(1)}</div>
              <div style={{ paddingRight: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: p.faint, marginBottom: 5 }}>
                  <span>{s.submitted}/{s.total}</span>
                </div>
                <Progress p={p} value={(s.submitted / s.total) * 100} height={5} />
              </div>
              <div style={{ fontSize: 12, color: p.sub }}>{s.last}</div>
              <div style={{ textAlign: 'right' }}><Tag p={p} color={statusTone(p, s.status)}>{statusLabel(s.status)}</Tag></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {classAssignments.map((a) => <AssignmentRow key={a.id} a={a} p={p} go={go} />)}
        </div>
      )}

      {tab === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
          {DB.DOCS.slice(0, 6).map((d) => <DocCardMini key={d.id} d={d} p={p} />)}
        </div>
      )}

      {tab === 'notices' && (
        <div style={tCard(p)}>
          {DB.NOTICES.concat(DB.NOTICES.slice(0, 1)).map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: i ? `1px solid ${p.line}` : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: p.sink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={n.icon} size={16} stroke={p.sub} /></div>
              <div><div style={{ fontSize: 13.5, color: p.ink }}>{n.title}</div>
                <div style={{ fontSize: 11, color: p.faint, marginTop: 3, fontFamily: FONTS.mono }}>{n.time}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// shared bits used by class detail + assignments screen
export function AssignmentRow({ a, p, go }) {
  const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
  return (
    <div className="lms-card" onClick={() => go('grade-one', { assignment: a.id })}
      style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: hexA(tone, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="assign" size={20} stroke={tone} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{a.title}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: p.sub, flexWrap: 'wrap' }}>
          <span>{a.type}</span><span>· {a.questions} câu</span><span>· {a.points} điểm</span>
          <span style={{ fontFamily: FONTS.mono, color: tone }}>· {a.dueIn}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: p.ink }}>{a.submitted}/{a.total}</div>
        <div style={{ fontSize: 10.5, color: p.faint }}>đã nộp</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        {a.submitted > a.graded ? <Tag p={p} color={p.accent}>{a.submitted - a.graded} chờ chấm</Tag> : <Tag p={p} color={p.ok}>Đã chấm</Tag>}
      </div>
      <Icon name="chevronRight" size={18} stroke={p.faint} />
    </div>
  );
}

const DOC_ICONS = { pdf: 'docs', slide: 'image', audio: 'play', video: 'video', image: 'image', doc: 'docs' };
export function DocCardMini({ d, p }) {
  const ic = DOC_ICONS[d.type] || 'docs';
  return (
    <div className="lms-card" style={{ background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={ic} size={19} stroke={p.accent} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, lineHeight: 1.3 }}>{d.name}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 3 }}>{d.type.toUpperCase()} · {d.size}</div>
        </div>
      </div>
    </div>
  );
}
