'use client';
import React from 'react';
import { Icon, Tag, Avatar, Btn, Progress, Ring, EmptyState } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { RubricMatrix } from '@/app/screens/resources';

// screens-grade.jsx — Grading queue + the grading workspace (rubric + numeric).

function gCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

// ── Grading queue ────────────────────────────────────────────────────────────
export function TGrade({ p, t, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const ungraded = (aid) => DB.SUBMISSIONS.filter((s) => s.assignmentId === aid && s.status !== 'graded').length;
  const queue = DB.ASSIGNMENTS.filter((a) => ungraded(a.id) > 0);
  const total = queue.reduce((s, a) => s + ungraded(a.id), 0);
  if (queue.length === 0) {
    return (
      <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
        <div style={{ ...gCard(p), marginTop: 40 }}>
          <EmptyState p={p} icon="checkCircle" label="Đã chấm xong tất cả bài nộp" sub="Khi học viên nộp bài mới, bài sẽ xuất hiện ở đây." />
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ ...gCard(p, 24), marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20,
        background: p.accentSoft, border: `1px solid ${hexA(p.accent, 0.3)}` }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="grade" size={28} stroke="#fff" /></div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, margin: 0, color: p.ink }}>{total} bài đang chờ chấm</h2>
          <div style={{ fontSize: 13.5, color: p.sub, marginTop: 4 }}>Trải đều trên {queue.length} bài tập · ưu tiên các bài sắp đến hạn trả.</div>
        </div>
        <Btn p={p} variant="accent" icon="play" onClick={() => go('grade-one', { assignment: queue[0].id })}>Bắt đầu chấm</Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {queue.map((a) => {
          const left = ungraded(a.id);
          return (
            <div key={a.id} className="lms-card" onClick={() => go('grade-one', { assignment: a.id })}
              style={{ ...gCard(p, 18), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.rubric ? 'rubric' : 'grade'} size={20} stroke={p.accent} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: p.ink }}>{a.title}</span>
                  {a.rubric && <Tag p={p} color={p.accent}>Rubric</Tag>}
                </div>
                <div style={{ fontSize: 12.5, color: p.sub, marginTop: 4 }}>{a.type} · hạn {a.due}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 600, color: p.accent, lineHeight: 1 }}>{left}</div>
                <div style={{ fontSize: 10.5, color: p.faint, fontFamily: FONTS.mono, marginTop: 3 }}>chờ chấm</div>
              </div>
              <Btn p={p} variant="soft" size="sm" iconRight="arrowRight">Chấm</Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Grading workspace ────────────────────────────────────────────────────────
const QUICK_COMMENTS = ['Phân tích sâu, cảm thụ tốt!', 'Cần thêm dẫn chứng tiêu biểu.', 'Chú ý lỗi diễn đạt, chính tả.', 'Bố cục rõ ràng, lập luận thuyết phục.'];

export function TGradeOne({ p, t, ctx, setRoute }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const a = DB.ASSIGNMENTS.find((x) => x.id === ctx.assignment) || DB.ASSIGNMENTS[1];
  const useRubric = !!a.rubric;
  const rubric = useRubric ? DB.RUBRICS.find((r) => r.id === a.rubric) : null;
  const subs = DB.SUBMISSIONS.filter((s) => s.assignmentId === a.id);
  const [idx, setIdx] = React.useState(0);
  const sub = subs[idx] || subs[0];

  // grading state per submission
  const [sel, setSel] = React.useState({});       // ci -> si
  const [score, setScore] = React.useState('');
  const [fb, setFb] = React.useState('');
  const rubricStyle = t.rubricStyle || 'matrix';

  // recompute numeric from rubric whenever selection changes
  const rubricScore = React.useMemo(() => {
    if (!rubric) return null;
    let sum = 0, any = false;
    rubric.criteria.forEach((c, ci) => { if (sel[ci] != null) { any = true; sum += c.weight * rubric.scale[sel[ci]].pct / 100; } });
    return any ? Math.round((sum / 10) * 10) / 10 : null;
  }, [sel, rubric]);
  React.useEffect(() => { if (rubricScore != null) setScore(String(rubricScore)); }, [rubricScore]);

  const reset = (i) => { setIdx(i); setSel({}); setScore(''); setFb(''); };
  const gradedCount = subs.filter((s) => s.status === 'graded').length;

  if (subs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 30px', borderBottom: `1px solid ${p.line}` }}>
          <div onClick={() => setRoute('grade')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} stroke={p.sub} /> Hàng chờ</div>
          <div style={{ width: 1, height: 26, background: p.line }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: p.ink }}>{a.title}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState p={p} icon="grade" label="Chưa có bài nộp" sub="Khi học viên nộp bài, bài sẽ xuất hiện ở đây để bạn chấm." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* sticky header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 30px', borderBottom: `1px solid ${p.line}`, flexShrink: 0 }}>
        <div onClick={() => setRoute('grade')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer' }}>
          <Icon name="arrowLeft" size={16} stroke={p.sub} /> Hàng chờ
        </div>
        <div style={{ width: 1, height: 26, background: p.line }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
          <div style={{ fontSize: 12, color: p.faint, marginTop: 1 }}>{useRubric ? rubric.name : 'Chấm điểm số'}</div>
        </div>
        <div className="lms-hide-sm" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: p.sub }}>Đã chấm {gradedCount}/{subs.length}</span>
          <div style={{ width: 120 }}><Progress p={p} value={(gradedCount / subs.length) * 100} height={6} /></div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: t.railWide ? '240px minmax(0,1fr)' : '216px minmax(0,1fr)', minHeight: 0 }}>
        {/* submission rail */}
        <div className="lms-scroll" style={{ borderRight: `1px solid ${p.line}`, overflowY: 'auto', padding: 12 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.5, color: p.faint, padding: '6px 10px 8px' }}>BÀI NỘP · {subs.length}</div>
          {subs.map((s, i) => {
            const on = i === idx;
            return (
              <div key={s.id} onClick={() => reset(i)} className="lms-nav-item"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                  background: on ? p.activeBg : 'transparent' }}>
                <Avatar name={s.name} p={p} size={32} accent={on} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: on ? 600 : 500, color: p.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: p.faint }}>{s.code}</div>
                </div>
                {s.status === 'graded'
                  ? <span style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: p.ok }}>{s.score}</span>
                  : <span style={{ width: 7, height: 7, borderRadius: 4, background: p.accent }} />}
              </div>
            );
          })}
        </div>

        {/* main: submission content + grading panel — wraps panel below when narrow */}
        <div className="lms-scroll" style={{ overflowY: 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* submission content */}
        <div style={{ flex: '1 1 440px', minWidth: 0, padding: '26px 32px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <Avatar name={sub.name} p={p} size={46} accent />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: p.ink }}>{sub.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, color: p.faint, marginTop: 2 }}>{sub.code} · nộp {sub.at}</div>
              </div>
              {sub.status === 'graded' && <Tag p={p} color={p.ok}>Đã chấm · {sub.score}</Tag>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Tag p={p} color={p.sub}>BÀI LÀM</Tag>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{sub.wordcount} chữ</span>
            </div>
            <div style={{ ...gCard(p, 26), fontSize: 16, lineHeight: 1.9, color: p.ink, fontFamily: FONTS.sans, letterSpacing: 0.2 }}>
              {sub.text}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22 }}>
              <Btn p={p} variant="ghost" icon="arrowLeft" onClick={() => reset((idx - 1 + subs.length) % subs.length)}>Bài trước</Btn>
              <div style={{ flex: 1 }} />
              <Btn p={p} variant="ghost" iconRight="arrowRight" onClick={() => reset((idx + 1) % subs.length)}>Bài sau</Btn>
            </div>
          </div>
        </div>

        {/* grading panel */}
        <div style={{ flex: '1 1 340px', minWidth: 0, borderLeft: `1px solid ${p.line}`, padding: 22, background: p.railBg, alignSelf: 'stretch' }}>
          {useRubric && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>CHẤM THEO RUBRIC</span>
                <Tag p={p} color={p.accent}>{Object.keys(sel).length}/{rubric.criteria.length} tiêu chí</Tag>
              </div>
              {rubricStyle === 'matrix' && (
                <div style={{ marginBottom: 18, overflowX: 'auto' }}>
                  <RubricMatrix rubric={rubric} p={p} mode="grade" selected={sel} onSelect={(ci, si) => setSel({ ...sel, [ci]: si })} />
                </div>
              )}
              {rubricStyle === 'cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                  {rubric.criteria.map((c, ci) => (
                    <div key={ci} style={{ ...gCard(p, 14) }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>{c.name}</span>
                        <Tag p={p} color={p.accent}>{c.weight}%</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {rubric.scale.map((s, si) => {
                          const on = sel[ci] === si;
                          return (
                            <button key={si} onClick={() => setSel({ ...sel, [ci]: si })} style={{ flex: 1, minWidth: 64, padding: '8px 6px', borderRadius: 9, cursor: 'pointer',
                              border: `1px solid ${on ? p.accent : p.line}`, background: on ? p.accentSoft : p.surface,
                              fontFamily: FONTS.sans, fontSize: 11, fontWeight: on ? 600 : 500, color: on ? p.accent : p.sub }}>
                              {s.label}<div style={{ fontFamily: FONTS.mono, fontSize: 10, color: p.faint, marginTop: 2 }}>{((c.weight * s.pct) / 1000).toFixed(1)}đ</div>
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

          {/* score */}
          <div style={{ ...gCard(p, 18), marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, marginBottom: 6 }}>ĐIỂM SỐ {useRubric ? '(từ rubric, có thể chỉnh)' : ''}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="—"
                  style={{ width: 70, border: 'none', outline: 'none', background: 'transparent', fontFamily: FONTS.display,
                    fontSize: 40, fontWeight: 600, color: p.accent, letterSpacing: -1 }} />
                <span style={{ fontSize: 18, color: p.faint }}>/ {a.points}</span>
              </div>
            </div>
            <Ring value={score ? (Number(score) / a.points) * 100 : 0} size={62} thickness={7} p={p} color={p.accent}
              label={score ? Number(score).toFixed(1) : '—'} />
          </div>

          {/* feedback */}
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, marginBottom: 8 }}>NHẬN XÉT</div>
          <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Nhận xét cho học viên…"
            style={{ width: '100%', minHeight: 86, padding: 12, borderRadius: 12, border: `1px solid ${p.line}`, background: p.surface,
              color: p.ink, fontFamily: FONTS.sans, fontSize: 13, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {QUICK_COMMENTS.map((qc, i) => (
              <button key={i} onClick={() => setFb(fb ? fb + ' ' + qc : qc)} style={{ padding: '5px 10px', borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${p.line}`, background: p.surface, color: p.sub, fontFamily: FONTS.sans, fontSize: 11.5 }}>+ {qc}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Btn p={p} variant="ghost" full>Lưu nháp</Btn>
            <Btn p={p} variant="accent" full icon="check" onClick={() => { LMS && LMS.gradeSubmission(sub.id, score || rubricScore || 0, fb); reset((idx + 1) % subs.length); }}>Lưu & bài tiếp</Btn>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
