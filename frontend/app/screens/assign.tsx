'use client';
import React from 'react';
import { Icon, Tag, Pill, Btn, Field, Select, Progress } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { lblStyle, ToggleRow } from '@/app/helpers/shared';
import { typeMeta } from '@/app/screens/bank';
import { DOC_TYPE_META } from '@/app/screens/resources';

function aCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

// ── Assignment list ──────────────────────────────────────────────────────────
export function TAssignments({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [status, setStatus] = React.useState('all');
  const filt = { all: () => true, open: (a) => a.status === 'open' || a.status === 'closing',
    grading: (a) => a.submitted > a.graded, done: (a) => a.status === 'done' };
  const list = DB.ASSIGNMENTS.filter(filt[status]);
  const counts = {
    open: DB.ASSIGNMENTS.filter(filt.open).length, grading: DB.ASSIGNMENTS.filter(filt.grading).length,
    done: DB.ASSIGNMENTS.filter(filt.done).length,
  };
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <Pill p={p} active={status === 'all'} onClick={() => setStatus('all')}>Tất cả · {DB.ASSIGNMENTS.length}</Pill>
        <Pill p={p} active={status === 'open'} onClick={() => setStatus('open')}>Đang mở · {counts.open}</Pill>
        <Pill p={p} active={status === 'grading'} onClick={() => setStatus('grading')}>Chờ chấm · {counts.grading}</Pill>
        <Pill p={p} active={status === 'done'} onClick={() => setStatus('done')}>Đã đóng · {counts.done}</Pill>
        <div style={{ flex: 1 }} />
        <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((a) => {
          const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
          const pct = Math.round((a.submitted / a.total) * 100);
          return (
            <div key={a.id} className="lms-card" onClick={() => go('grade-one', { assignment: a.id })}
              style={{ ...aCard(p, 20), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: hexA(tone, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="assign" size={21} stroke={tone} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: p.ink }}>{a.title}</span>
                  {a.rubric && <Tag p={p} color={p.accent}>Rubric</Tag>}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 12.5, color: p.sub, flexWrap: 'wrap' }}>
                  <span>{a.type}</span><span>· {a.questions} câu · {a.points}đ</span>
                  <span style={{ fontFamily: FONTS.mono, color: tone }}>· {a.dueIn}</span>
                </div>
              </div>
              <div style={{ width: 150 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: p.faint, marginBottom: 5 }}>
                  <span>Đã nộp {a.submitted}/{a.total}</span><span style={{ fontFamily: FONTS.mono }}>{pct}%</span>
                </div>
                <Progress p={p} value={pct} height={6} />
              </div>
              <div style={{ minWidth: 110, textAlign: 'center' }}>
                {a.submitted > a.graded ? <Btn p={p} variant="soft" size="sm" icon="grade">Chấm {a.submitted - a.graded}</Btn>
                  : <Tag p={p} color={p.ok}>Đã chấm xong</Tag>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Create / assign flow ─────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: 'Thông tin', icon: 'assign' },
  { id: 1, label: 'Nội dung', icon: 'bank' },
  { id: 2, label: 'Cài đặt & giao', icon: 'send' },
];

export function TAssignNew({ p, t, setRoute }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const wizard = (t.assignFlow || 'wizard') === 'wizard';
  const [step, setStep] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [cls, setCls] = React.useState('public');
  const [kind, setKind] = React.useState('quiz');
  const [picked, setPicked] = React.useState(['q1', 'q2']);
  const [docs, setDocs] = React.useState(['d2']);
  const [points, setPoints] = React.useState(10);
  const [rubric, setRubric] = React.useState('none');

  const togglePick = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const toggleDoc = (id) => setDocs(docs.includes(id) ? docs.filter((x) => x !== id) : [...docs, id]);
  const visible = (s) => wizard ? step === s : true;

  const StepInfo = (
    <section style={{ ...aCard(p, 24), marginBottom: 20 }}>
      <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 18px', color: p.ink }}>Thông tin bài tập</h3>
      <label style={lblStyle(p)}>TIÊU ĐỀ</label>
      <Field p={p} value={title} onChange={setTitle} placeholder="vd: Trắc nghiệm đọc hiểu — Dế Mèn bênh vực kẻ yếu" style={{ marginTop: 8, marginBottom: 18 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div><label style={lblStyle(p)}>PHẠM VI</label>
          <Select p={p} value={cls} onChange={setCls} style={{ marginTop: 8 }}
            options={[{ value: 'public', label: 'Công khai cho mọi người' }, { value: 'member', label: 'Chỉ người đã đăng nhập' }]} /></div>
        <div><label style={lblStyle(p)}>HÌNH THỨC</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[['quiz', 'Trắc nghiệm', 'bank'], ['essay', 'Tự luận', 'docs'], ['file', 'Nộp tệp', 'upload']].map(([k, lab, ic]) => (
              <div key={k} onClick={() => setKind(k)} className="lms-row" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px', borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${kind === k ? p.accent : p.line}`, background: kind === k ? p.accentSoft : p.surface }}>
                <Icon name={ic} size={18} stroke={kind === k ? p.accent : p.faint} />
                <span style={{ fontSize: 12, fontWeight: kind === k ? 600 : 500, color: kind === k ? p.accent : p.sub }}>{lab}</span>
              </div>
            ))}
          </div></div>
      </div>
      <label style={lblStyle(p)}>HƯỚNG DẪN (tuỳ chọn)</label>
      <textarea placeholder="Ghi chú cho học viên…" style={{ width: '100%', minHeight: 70, marginTop: 8, padding: 12, borderRadius: 12, border: `1px solid ${p.line}`,
        background: p.surface, color: p.ink, fontFamily: FONTS.sans, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
    </section>
  );

  const StepContent = (
    <section style={{ ...aCard(p, 24), marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: 0, color: p.ink }}>
          {kind === 'quiz' ? 'Chọn câu hỏi từ ngân hàng' : 'Đính kèm tài liệu'}</h3>
        {kind === 'quiz' && <Tag p={p} color={p.accent}>{picked.length} câu đã chọn</Tag>}
      </div>
      {kind === 'quiz' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DB.QUESTIONS.map((q) => {
            const on = picked.includes(q.id), tm = typeMeta(q.type);
            return (
              <div key={q.id} onClick={() => togglePick(q.id)} className="lms-row"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${on ? p.accent : p.line}`, background: on ? p.accentSoft : p.surface }}>
                <span style={{ width: 20, height: 20, borderRadius: 8, flexShrink: 0, border: `1.8px solid ${on ? p.accent : p.faint}`,
                  background: on ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}</span>
                <Icon name={tm.icon} size={16} stroke={p.faint} />
                <span style={{ flex: 1, fontSize: 13.5, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.stem}</span>
                <Tag p={p} color={p.sub}>{tm.short}</Tag>
              </div>
            );
          })}
          <Btn p={p} variant="quiet" size="sm" icon="plus" style={{ marginTop: 6, paddingLeft: 0 }} onClick={() => setRoute('bank-edit')}>Soạn câu hỏi mới</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DB.DOCS.slice(0, 5).map((d) => {
            const on = docs.includes(d.id), m = DOC_TYPE_META[d.type];
            return (
              <div key={d.id} onClick={() => toggleDoc(d.id)} className="lms-row"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${on ? p.accent : p.line}`, background: on ? p.accentSoft : p.surface }}>
                <span style={{ width: 20, height: 20, borderRadius: 8, flexShrink: 0, border: `1.8px solid ${on ? p.accent : p.faint}`,
                  background: on ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}</span>
                <Icon name={m.icon} size={16} stroke={p.faint} />
                <span style={{ flex: 1, fontSize: 13.5, color: p.ink }}>{d.name}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{d.size}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const StepSettings = (
    <section style={{ ...aCard(p, 24), marginBottom: 20 }}>
      <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 500, margin: '0 0 18px', color: p.ink }}>Cài đặt & giao bài</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div><label style={lblStyle(p)}>HẠN NỘP</label><Field p={p} value="26/06/2026 · 23:59" onChange={() => {}} icon="calendar" style={{ marginTop: 8 }} /></div>
        <div><label style={lblStyle(p)}>ĐIỂM TỐI ĐA</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, marginTop: 8, padding: '0 13px', borderRadius: 10, border: `1px solid ${p.line}`, background: p.surface }}>
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: p.ink, fontFamily: FONTS.mono, fontSize: 14 }} />
            <span style={{ fontSize: 12.5, color: p.faint }}>điểm</span>
          </div></div>
      </div>
      <label style={lblStyle(p)}>CHẤM BẰNG RUBRIC</label>
      <Select p={p} value={rubric} onChange={setRubric} style={{ marginTop: 8, marginBottom: 18 }}
        options={[{ value: 'none', label: 'Không dùng rubric — chấm điểm số' }, ...DB.RUBRICS.map((r) => ({ value: r.id, label: r.name }))]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['Cho phép nộp muộn', false], ['Xáo trộn thứ tự câu hỏi', true], ['Hiện điểm ngay sau khi nộp', false], ['Thông báo cho học viên', true]].map(([lab, def], i) => (
          <ToggleRow key={i} p={p} label={lab} def={def} />
        ))}
      </div>
    </section>
  );

  return (
    <div style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('assignments')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Bài tập
      </div>

      {wizard && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {STEPS.map((s, i) => {
            const done = step > s.id, on = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div onClick={() => setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? p.accent : done ? p.accentSoft : p.sink, color: on ? '#fff' : done ? p.accent : p.faint,
                    border: `1px solid ${on || done ? p.accent : p.line}` }}>
                    {done ? <Icon name="check" size={16} stroke={p.accent} sw={2.4} /> : <span style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600 }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? p.ink : p.sub }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: done ? p.accent : p.line, margin: '0 16px' }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {visible(0) && StepInfo}
      {visible(1) && StepContent}
      {visible(2) && StepSettings}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        {wizard && step > 0 && <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => setStep(step - 1)}>Quay lại</Btn>}
        {wizard && step < 2
          ? <Btn p={p} iconRight="arrowRight" onClick={() => setStep(step + 1)}>Tiếp tục</Btn>
          : <><Btn p={p} variant="ghost">Lưu nháp</Btn><Btn p={p} variant="accent" icon="send" onClick={() => {
              const typeLabel = kind === 'quiz' ? 'Trắc nghiệm' : kind === 'essay' ? 'Tự luận' : 'Nộp tệp';
              LMS && LMS.addAssignment({ title: title || 'Bài luyện tập mới', type: typeLabel, due: 'Sắp tới', dueIn: 'Mới đăng', points: Number(points) || 10, rubric: rubric !== 'none' ? rubric : undefined, questions: kind === 'quiz' ? picked.length : 1 });
              setRoute('assignments');
            }}>Đăng bài luyện tập</Btn></>}
      </div>
    </div>
  );
}
