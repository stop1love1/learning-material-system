'use client';
// bank.tsx — Question bank (master/detail) + question editor.
// Also exports QuestionView, used by student "do assignment" and review screens.
import React from 'react';
import { Icon, Tag, Pill, Btn, IconBtn, Field, Select } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { lblStyle } from '@/app/helpers/shared';

function bCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

export function typeMeta(id) { return DB.QTYPES.find((x) => x.id === id) || DB.QTYPES[0]; }
export function levelMeta(id) { return DB.LEVELS.find((x) => x.id === id) || DB.LEVELS[0]; }

// ── QuestionView: render a question. mode = 'preview' | 'do' ──────────────────
// Smooth fill-in-the-blank input
export function FillInput({ p, value, onChange }) {
  const [focus, setFocus] = React.useState(false);
  const filled = (value || '').trim().length > 0;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <input value={value || ''} onChange={(e) => onChange({ text: e.target.value })}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder="Điền đáp án…"
        style={{ height: 48, minWidth: 240, padding: '0 18px', borderRadius: 12, fontFamily: FONTS.mono, fontSize: 16,
          border: `1.5px solid ${focus ? p.accent : filled ? hexA(p.accent, 0.5) : p.line}`, background: p.surface, color: p.ink,
          outline: 'none', boxShadow: focus ? `0 0 0 4px ${p.accentSoft}` : 'none', transition: 'border-color .18s, box-shadow .2s' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
        color: filled ? p.ok : p.faint, opacity: 1, transition: 'color .2s' }}>
        <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: filled ? p.ok : 'transparent', border: filled ? 'none' : `1.5px solid ${p.line}`, transform: filled ? 'scale(1)' : 'scale(.9)', transition: 'all .2s' }}>
          {filled && <Icon name="check" size={11} stroke="#fff" sw={2.6} />}
        </span>
        {filled ? 'Đã điền' : 'Chưa điền'}
      </span>
    </div>
  );
}

// Smooth drag-and-drop / tap matching board
export function MatchBoard({ p, q, answer, onAnswer }) {
  const map = (answer && answer.map) || {};
  const rights = q.pairs.map((pr) => pr[1]);
  const used = Object.values(map);
  const pool = rights.filter((r) => !used.includes(r));
  const [pick, setPick] = React.useState(null);     // tapped pool value
  const [over, setOver] = React.useState(null);      // left index being hovered
  const set = (li, val) => { const m = { ...map }; Object.keys(m).forEach((k) => { if (m[k] === val) delete m[k]; }); m[li] = val; onAnswer({ map: m }); setPick(null); };
  const clear = (li) => { const m = { ...map }; delete m[li]; onAnswer({ map: m }); };
  const chip = (val: any, opts: any = {}) => (
    <div draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', val); }} onClick={() => setPick(pick === val ? null : val)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10, cursor: 'grab', userSelect: 'none',
        background: pick === val ? p.accent : p.accentSoft, color: pick === val ? '#fff' : p.accent, fontWeight: 600, fontSize: 14,
        border: `1px solid ${pick === val ? p.accent : 'transparent'}`, transition: 'transform .15s, background .15s', ...opts.style }}>
      <Icon name="drag" size={14} stroke={pick === val ? '#fff' : p.accent} /> {val}
      {opts.onX && <span onClick={(e) => { e.stopPropagation(); opts.onX(); }} style={{ display: 'inline-flex', marginLeft: 2 }}><Icon name="x" size={13} stroke={pick === val ? '#fff' : p.accent} /></span>}
    </div>
  );
  return (
    <div>
      {pool.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, borderRadius: 12, background: p.sink, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: p.faint, alignSelf: 'center', marginRight: 4 }}>Kéo (hoặc chạm) đáp án vào ô:</span>
          {pool.map((val) => <React.Fragment key={val}>{chip(val)}</React.Fragment>)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.pairs.map((pr, i) => {
          const val = map[i];
          const isOver = over === i;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: `1px solid ${p.line}`, background: p.surface,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: p.ink }}>{pr[0]}</div>
              <Icon name="arrowRight" size={16} stroke={p.faint} />
              <div onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); const v = e.dataTransfer.getData('text/plain'); if (v) set(i, v); setOver(null); }}
                onClick={() => { if (pick) set(i, pick); else if (val) clear(i); }}
                style={{ flex: 1, minHeight: 46, padding: '7px 12px', borderRadius: 10, display: 'flex', alignItems: 'center',
                  border: `1.5px dashed ${isOver ? p.accent : val ? 'transparent' : p.line}`,
                  background: isOver ? p.accentSoft : val ? 'transparent' : p.raise, cursor: pick || val ? 'pointer' : 'default', transition: 'all .15s' }}>
                {val ? chip(val, { onX: () => clear(i), style: { cursor: 'pointer' } })
                  : <span style={{ fontSize: 13, color: isOver ? p.accent : p.faint }}>{isOver ? 'Thả vào đây' : 'Thả đáp án…'}</span>}
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
  const optStyle = (selected, correct) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
    border: `1px solid ${correct && mode === 'preview' ? p.ok : selected ? p.accent : p.line}`,
    background: correct && mode === 'preview' ? hexA(p.ok, 0.08) : selected ? p.accentSoft : p.surface,
    cursor: mode === 'do' ? 'pointer' : 'default', marginBottom: 8,
  });

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
          const box = q.type === 'single' ? '50%' : 6;
          return (
            <div key={i} onClick={() => toggle(i)} style={optStyle(selected, correct)}>
              <span style={{ width: 20, height: 20, borderRadius: box, flexShrink: 0, border: `1.8px solid ${(correct && mode === 'preview') ? p.ok : selected ? p.accent : p.faint}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (selected || (correct && mode === 'preview')) ? (correct && mode === 'preview' ? p.ok : p.accent) : 'transparent' }}>
                {(selected || (correct && mode === 'preview')) && <Icon name="check" size={12} stroke="#fff" sw={2.5} />}
              </span>
              <span style={{ fontSize: 14, color: p.ink, flex: 1 }}>{o}</span>
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
      <div style={{ display: 'flex', gap: 12 }}>
        {['Đúng', 'Sai'].map((lab, i) => {
          const selected = sel === i, correct = isCorrect(i);
          return (
            <div key={i} onClick={() => mode === 'do' && onAnswer({ choices: [i] })}
              style={{ flex: 1, ...optStyle(selected, correct), justifyContent: 'center', marginBottom: 0, padding: '16px' }}>
              <Icon name={i === 0 ? 'check' : 'x'} size={18} stroke={correct && mode === 'preview' ? p.ok : selected ? p.accent : p.faint} sw={2.2} />
              <span style={{ fontSize: 15, fontWeight: 600, color: p.ink }}>{lab}</span>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10,
            border: `1px dashed ${p.ok}`, background: hexA(p.ok, 0.06) }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 15, color: p.ink }}>{(q.answer || ['—'])[0]}</span>
            <Tag p={p} color={p.ok}>Đáp án</Tag>
          </div>
        )}
      </div>
    );
  }

  if (q.type === 'essay') {
    return mode === 'do' ? (
      <textarea value={a.text || ''} onChange={(e) => onAnswer({ text: e.target.value })} placeholder="Viết câu trả lời của bạn…"
        style={{ width: '100%', minHeight: 160, padding: 14, borderRadius: 12, border: `1px solid ${p.line}`, background: p.surface,
          color: p.ink, fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
    ) : (
      <div style={{ padding: 14, borderRadius: 12, border: `1px dashed ${p.line}`, background: p.raise, color: p.sub, fontSize: 13, fontStyle: 'italic' }}>
        Câu tự luận — chấm bằng rubric hoặc cho điểm thủ công.
      </div>
    );
  }

  if (q.type === 'match') {
    if (mode === 'do') return <MatchBoard p={p} q={q} answer={a} onAnswer={onAnswer} />;
    const right = q.pairs.map((pr) => pr[1]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.pairs.map((pr, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: `1px solid ${p.line}`, background: p.surface,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="drag" size={15} stroke={p.faint} />
              <span style={{ fontSize: 15, color: p.ink }}>{pr[0]}</span>
            </div>
            <Icon name="arrowRight" size={16} stroke={p.ok} />
            <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10,
              border: `1px solid ${p.ok}`, background: hexA(p.ok, 0.07) }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 14, color: p.ink }}>{pr[1]}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Question bank (master / detail) ──────────────────────────────────────────
export function TBank({ p, t, setRoute }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [type, setType] = React.useState('all');
  const [sel, setSel] = React.useState(DB.QUESTIONS[0].id);
  const list = type === 'all' ? DB.QUESTIONS : DB.QUESTIONS.filter((q) => q.type === type);
  const q = DB.QUESTIONS.find((x) => x.id === sel) || list[0];
  const tm = typeMeta(q.type), lm = levelMeta(q.level);
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Field p={p} icon="search" placeholder="Tìm câu hỏi, chủ đề…" style={{ width: 280 }} />
        <div style={{ flex: 1 }} />
        <Btn p={p} variant="ghost" size="md" icon="filter">Bộ lọc</Btn>
        <Btn p={p} icon="plus" onClick={() => setRoute('bank-edit')}>Soạn câu hỏi</Btn>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <Pill p={p} active={type === 'all'} onClick={() => setType('all')}>Tất cả · {DB.QUESTIONS.length}</Pill>
        {DB.QTYPES.map((qt) => {
          const n = DB.QUESTIONS.filter((x) => x.type === qt.id).length;
          return <Pill key={qt.id} p={p} icon={qt.icon} active={type === qt.id} onClick={() => setType(qt.id)}>{qt.short} · {n}</Pill>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((item) => {
            const im = typeMeta(item.type), il = levelMeta(item.level), on = item.id === sel;
            return (
              <div key={item.id} onClick={() => setSel(item.id)} className="lms-card"
                style={{ ...bCard(p, 16), cursor: 'pointer', borderColor: on ? p.accent : p.line,
                  boxShadow: on ? `0 0 0 1px ${p.accent}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={im.icon} size={15} stroke={p.accent} /></span>
                  <Tag p={p} color={p.sub}>{im.short}</Tag>
                  <Tag p={p} color={il.color}>{il.label}</Tag>
                  <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 10.5, color: p.faint }}>{item.topic}</span>
                </div>
                <div style={{ fontSize: 14, color: p.ink, lineHeight: 1.5, fontWeight: 500 }}>{item.stem}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 11.5, color: p.faint }}>
                  <span>Dùng {item.uses} lần</span><span>· {item.updated}</span><span>· {item.author}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'sticky', top: 0 }}>
          <div style={bCard(p, 22)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag p={p} color={p.accent}>{tm.label}</Tag>
                <Tag p={p} color={lm.color}>{lm.label}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <IconBtn name="pen" p={p} size={32} onClick={() => setRoute('bank-edit')} title="Sửa" />
                <IconBtn name="copy" p={p} size={32} title="Nhân bản" />
              </div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, marginBottom: 8 }}>CHỦ ĐỀ · {q.topic.toUpperCase()}</div>
            <div style={{ fontSize: 17, color: p.ink, lineHeight: 1.5, marginBottom: 20, fontWeight: 500 }}>{q.stem}</div>
            <QuestionView q={q} p={p} mode="preview" />
            <div style={{ display: 'flex', gap: 16, marginTop: 22, paddingTop: 16, borderTop: `1px solid ${p.line}`, fontSize: 12, color: p.faint }}>
              <span>Đã dùng {q.uses} lần</span><span>· Cập nhật {q.updated}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Question editor ──────────────────────────────────────────────────────────
export function TBankEdit({ p, t, setRoute }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [type, setType] = React.useState('single');
  const [level, setLevel] = React.useState('medium');
  const [stem, setStem] = React.useState('');
  const [options, setOptions] = React.useState(['', '', '', '']);
  const [correct, setCorrect] = React.useState([0]);
  const tm = typeMeta(type);

  const toggleCorrect = (i) => {
    if (type === 'single' || type === 'truefalse') setCorrect([i]);
    else setCorrect(correct.includes(i) ? correct.filter((x) => x !== i) : [...correct, i]);
  };
  const showOptions = type === 'single' || type === 'multi';

  return (
    <div style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('bank')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Ngân hàng câu hỏi
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={bCard(p, 22)}>
            <label style={lblStyle(p)}>LOẠI CÂU HỎI</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
              {DB.QTYPES.map((qt) => {
                const on = type === qt.id;
                return (
                  <div key={qt.id} onClick={() => setType(qt.id)} className="lms-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${on ? p.accent : p.line}`, background: on ? p.accentSoft : p.surface }}>
                    <Icon name={qt.icon} size={17} stroke={on ? p.accent : p.faint} />
                    <span style={{ fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? p.accent : p.sub }}>{qt.short}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={bCard(p, 22)}>
            <label style={lblStyle(p)}>NỘI DUNG CÂU HỎI</label>
            <textarea value={stem} onChange={(e) => setStem(e.target.value)} placeholder="Nhập đề bài. Có thể chèn trích dẫn thơ, đoạn văn…"
              style={{ width: '100%', minHeight: 90, marginTop: 10, padding: 13, borderRadius: 12, border: `1px solid ${p.line}`,
                background: p.surface, color: p.ink, fontFamily: FONTS.sans, fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />

            {showOptions && (
              <div style={{ marginTop: 18 }}>
                <label style={lblStyle(p)}>PHƯƠNG ÁN — bấm vòng tròn để chọn đáp án đúng</label>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {options.map((o, i) => {
                    const on = correct.includes(i);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span onClick={() => toggleCorrect(i)} style={{ width: 22, height: 22, flexShrink: 0, cursor: 'pointer',
                          borderRadius: type === 'multi' ? 6 : '50%', border: `1.8px solid ${on ? p.ok : p.faint}`,
                          background: on ? p.ok : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {on && <Icon name="check" size={13} stroke="#fff" sw={2.5} />}</span>
                        <input value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`Phương án ${i + 1}`}
                          style={{ flex: 1, height: 40, padding: '0 13px', borderRadius: 10, border: `1px solid ${p.line}`, background: p.surface,
                            color: p.ink, fontFamily: FONTS.sans, fontSize: 13.5, outline: 'none' }} />
                        <IconBtn name="trash" p={p} size={36} onClick={() => setOptions(options.filter((_, j) => j !== i))} />
                      </div>
                    );
                  })}
                </div>
                <Btn p={p} variant="quiet" size="sm" icon="plus" style={{ marginTop: 10, paddingLeft: 0 }} onClick={() => setOptions([...options, ''])}>Thêm phương án</Btn>
              </div>
            )}

            {type === 'truefalse' && (
              <div style={{ marginTop: 18 }}>
                <label style={lblStyle(p)}>ĐÁP ÁN ĐÚNG</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {['Đúng', 'Sai'].map((lab, i) => (
                    <div key={i} onClick={() => toggleCorrect(i)} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      border: `1px solid ${correct[0] === i ? p.ok : p.line}`, background: correct[0] === i ? hexA(p.ok, 0.08) : p.surface,
                      fontWeight: 600, color: correct[0] === i ? p.ok : p.sub }}>{lab}</div>
                  ))}
                </div>
              </div>
            )}

            {type === 'fill' && (
              <div style={{ marginTop: 18 }}>
                <label style={lblStyle(p)}>ĐÁP ÁN (chấp nhận nhiều cách viết, cách nhau bằng dấu /)</label>
                <Field p={p} value="" onChange={() => {}} placeholder="vd: hùm / cọp" style={{ marginTop: 10, maxWidth: 360 }} />
              </div>
            )}

            {type === 'essay' && (
              <div style={{ marginTop: 18 }}>
                <label style={lblStyle(p)}>CHẤM BẰNG</label>
                <Select p={p} value="rubric" onChange={() => {}} style={{ marginTop: 10, maxWidth: 360 }}
                  options={[{ value: 'rubric', label: 'Rubric Tập làm văn (tả – kể)' }, { value: 'manual', label: 'Cho điểm thủ công' }]} />
              </div>
            )}

            {type === 'match' && (
              <div style={{ marginTop: 18 }}>
                <label style={lblStyle(p)}>CẶP NỐI</label>
                {[['', ''], ['', '']].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <Field p={p} value="" onChange={() => {}} placeholder="Vế trái" style={{ flex: 1 }} />
                    <Icon name="link" size={16} stroke={p.faint} />
                    <Field p={p} value="" onChange={() => {}} placeholder="Vế phải" style={{ flex: 1 }} />
                  </div>
                ))}
                <Btn p={p} variant="quiet" size="sm" icon="plus" style={{ marginTop: 10, paddingLeft: 0 }}>Thêm cặp</Btn>
              </div>
            )}
          </section>

          <section style={bCard(p, 22)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lblStyle(p)}>ĐỘ KHÓ</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {DB.LEVELS.map((l) => (
                    <div key={l.id} onClick={() => setLevel(l.id)} style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${level === l.id ? l.color : p.line}`, background: level === l.id ? hexA(l.color, 0.1) : p.surface,
                      color: level === l.id ? l.color : p.sub, fontSize: 12.5, fontWeight: 600 }}>{l.label}</div>
                  ))}
                </div>
              </div>
              <div>
                <label style={lblStyle(p)}>CHỦ ĐỀ</label>
                <Field p={p} value="" onChange={() => {}} placeholder="vd: Ngữ pháp N4" style={{ marginTop: 10 }} />
              </div>
            </div>
          </section>
        </div>

        {/* Live preview */}
        <div style={{ position: 'sticky', top: 0 }}>
          <div style={bCard(p, 22)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon name="eye" size={16} stroke={p.faint} />
              <span style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>XEM TRƯỚC</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Tag p={p} color={p.accent}>{tm.label}</Tag>
              <Tag p={p} color={levelMeta(level).color}>{levelMeta(level).label}</Tag>
            </div>
            <div style={{ fontSize: 16, color: stem ? p.ink : p.faint, lineHeight: 1.5, marginBottom: 18, fontWeight: 500, fontStyle: stem ? 'normal' : 'italic' }}>
              {stem || 'Nội dung câu hỏi sẽ hiển thị ở đây…'}
            </div>
            <QuestionView q={{ type, options, answer: correct, pairs: [['Tre Việt Nam', 'Nguyễn Duy'], ['Truyện cổ nước mình', 'Lâm Thị Mỹ Dạ']], topic: '' }} p={p} mode="preview" />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn p={p} variant="ghost" full onClick={() => setRoute('bank')}>Huỷ</Btn>
            <Btn p={p} icon="check" full onClick={() => { LMS && LMS.addQuestion({ type, level, stem: stem || 'Câu hỏi mới', options: (type === 'single' || type === 'multi') ? options.filter(Boolean) : undefined, answer: correct, pairs: type === 'match' ? [['Vế trái 1', 'Vế phải 1'], ['Vế trái 2', 'Vế phải 2']] : undefined }); setRoute('bank'); }}>Lưu câu hỏi</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
