'use client';
import React from 'react';
import { Icon, Tag, Btn, IconBtn, Field, Segmented, Progress, Ring } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { lblStyle } from '@/app/helpers/shared';

// screens-resources.tsx — Document repository + Rubric list & builder.

function rCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

export const DOC_TYPE_META = {
  pdf: { icon: 'docs', label: 'PDF' }, slide: { icon: 'image', label: 'Slide' },
  audio: { icon: 'play', label: 'Audio' }, video: { icon: 'video', label: 'Video' },
  image: { icon: 'image', label: 'Ảnh' }, doc: { icon: 'docs', label: 'Tài liệu' },
};

// ── Document repository ──────────────────────────────────────────────────────
export function TDocs({ p, t }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [folder, setFolder] = React.useState('Tất cả');
  const [view, setView] = React.useState('grid');
  const docs = folder === 'Tất cả' ? DB.DOCS : DB.DOCS.filter((d) => d.folder === folder);
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 26 }}>
      <aside>
        <Btn p={p} icon="upload" full onClick={() => LMS && LMS.addDoc({ name: 'Tài liệu mới ' + (DB.DOCS.length + 1), type: 'doc', folder: folder === 'Tất cả' ? 'Tư liệu' : folder })}>Tải tài liệu lên</Btn>
        <div style={{ marginTop: 18, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, padding: '0 6px 8px' }}>THƯ MỤC</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DB.DOC_FOLDERS.map((f) => {
            const on = f === folder, n = f === 'Tất cả' ? DB.DOCS.length : DB.DOCS.filter((d) => d.folder === f).length;
            return (
              <div key={f} onClick={() => setFolder(f)} className="lms-nav-item"
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', borderRadius: 9, cursor: 'pointer',
                  background: on ? p.activeBg : 'transparent', color: on ? p.ink : p.sub, fontWeight: on ? 600 : 450, fontSize: 13 }}>
                <Icon name={f === 'Tất cả' ? 'cloud' : 'folder'} size={16} stroke={on ? p.accent : p.faint} />
                <span style={{ flex: 1 }}>{f}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint }}>{n}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 22, padding: 16, borderRadius: 12, background: p.surface, border: `1px solid ${p.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="cloud" size={16} stroke={p.accent} /><span style={{ fontSize: 12.5, fontWeight: 600, color: p.ink }}>Dung lượng</span>
          </div>
          <Progress p={p} value={21} />
          <div style={{ fontSize: 11, color: p.faint, marginTop: 8 }}>104,7 / 500 MB</div>
        </div>
      </aside>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Field p={p} icon="search" placeholder="Tìm tài liệu…" style={{ width: 260 }} />
          <div style={{ flex: 1 }} />
          <Segmented p={p} value={view} onChange={setView} options={[{ value: 'grid', icon: 'grid' }, { value: 'list', icon: 'list' }]} />
        </div>

        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 16 }}>
            <div className="lms-card" style={{ border: `1.5px dashed ${p.line}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 150, background: p.raise }}>
              <Icon name="upload" size={24} stroke={p.accent} />
              <div style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>Kéo thả tệp vào đây</div>
              <div style={{ fontSize: 11.5, color: p.faint, textAlign: 'center' }}>hoặc bấm để chọn tệp</div>
            </div>
            {docs.map((d) => {
              const m = DOC_TYPE_META[d.type];
              return (
                <div key={d.id} className="lms-card" style={{ ...rCard(p, 0), overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: 96, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Icon name={m.icon} size={32} stroke={p.accent} sw={1.4} />
                    <span style={{ position: 'absolute', top: 10, left: 10 }}><Tag p={p} color={p.accent}>{m.label}</Tag></span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: p.ink, lineHeight: 1.35, minHeight: 34 }}>{d.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: p.faint, fontFamily: FONTS.mono }}>
                      <span>{d.size}</span><span>↓ {d.downloads}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Btn p={p} variant="soft" size="sm" icon="download" full>Tải về</Btn>
                      <IconBtn name="more" p={p} size={34} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={rCard(p, 0)}>
            {docs.map((d, i) => {
              const m = DOC_TYPE_META[d.type];
              return (
                <div key={d.id} className="lms-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', cursor: 'pointer',
                  borderTop: i ? `1px solid ${p.lineSoft}` : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={m.icon} size={18} stroke={p.accent} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{d.name}</div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginTop: 2 }}>{m.label} · {d.size} · {d.folder}</div>
                  </div>
                  <div style={{ fontSize: 12, color: p.sub, width: 110 }}>{d.updated}</div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: p.faint, width: 60 }}>↓ {d.downloads}</div>
                  <Btn p={p} variant="soft" size="sm" icon="download">Tải</Btn>
                  <IconBtn name="more" p={p} size={34} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rubric matrix (shared: edit + grade modes) ───────────────────────────────
export function RubricMatrix({ rubric, p, mode = 'view', selected, onSelect }: any) {
  const scale = rubric.scale;
  return (
    <div className="lms-scrollx" style={{ border: `1px solid ${p.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `1.4fr repeat(${scale.length}, 1fr)`, background: p.raise, borderBottom: `1px solid ${p.line}` }}>
        <div style={{ padding: '11px 14px', fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint }}>TIÊU CHÍ</div>
        {scale.map((s, i) => (
          <div key={i} style={{ padding: '11px 12px', borderLeft: `1px solid ${p.line}`, textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: p.ink }}>{s.label}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: p.faint, marginTop: 2 }}>{s.pct}%</div>
          </div>
        ))}
      </div>
      {rubric.criteria.map((c, ci) => (
        <div key={ci} style={{ display: 'grid', gridTemplateColumns: `1.4fr repeat(${scale.length}, 1fr)`, borderTop: ci ? `1px solid ${p.lineSoft}` : 'none' }}>
          <div style={{ padding: '13px 14px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{c.name}</div>
            {c.desc && <div style={{ fontSize: 11.5, color: p.faint, marginTop: 3, lineHeight: 1.4 }}>{c.desc}</div>}
            <Tag p={p} color={p.accent} style={{ marginTop: 8 }}>{c.weight}%</Tag>
          </div>
          {scale.map((s, si) => {
            const on = selected && selected[ci] === si;
            return (
              <div key={si} onClick={() => mode === 'grade' && onSelect && onSelect(ci, si)}
                style={{ padding: '13px 10px', borderLeft: `1px solid ${p.lineSoft}`, cursor: mode === 'grade' ? 'pointer' : 'default',
                  background: on ? p.accentSoft : 'transparent', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center',
                  transition: 'background .12s' }}>
                {mode === 'grade' && (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.8px solid ${on ? p.accent : p.faint}`,
                    background: on ? p.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Icon name="check" size={11} stroke="#fff" sw={2.5} />}</span>
                )}
                <span style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: on ? p.accent : p.sub }}>
                  {((c.weight * s.pct) / 1000).toFixed(1)}</span>
                {mode === 'edit' && <span style={{ fontSize: 10.5, color: p.faint, textAlign: 'center' }}>điểm</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Rubric list ──────────────────────────────────────────────────────────────
export function TRubrics({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  return (
    <div style={{ padding: '24px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <Field p={p} icon="search" placeholder="Tìm rubric…" style={{ width: 260 }} />
        <div style={{ flex: 1 }} />
        <Btn p={p} icon="plus" onClick={() => setRoute('rubric-edit')}>Tạo rubric</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px,1fr))', gap: 20 }}>
        {DB.RUBRICS.map((r) => (
          <div key={r.id} onClick={() => go('rubric-edit', { rubric: r.id })} className="lms-card" style={{ ...rCard(p, 22), cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="rubric" size={20} stroke={p.accent} /></div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, margin: 0, color: p.ink, lineHeight: 1.2 }}>{r.name}</h3>
                  <div style={{ fontSize: 11.5, color: p.faint, marginTop: 3, fontFamily: FONTS.mono }}>{r.criteria.length} tiêu chí · {r.scale.length} mức · dùng {r.used} lần</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {r.criteria.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12.5, color: p.sub }}>{c.name}</div>
                  <div style={{ width: 70 }}><Progress p={p} value={c.weight} height={5} /></div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, width: 32, textAlign: 'right' }}>{c.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rubric builder ───────────────────────────────────────────────────────────
export function TRubricEdit({ p, t, ctx, setRoute }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const base = ctx.rubric ? DB.RUBRICS.find((r) => r.id === ctx.rubric) : DB.RUBRICS[0];
  const [rubric, setRubric] = React.useState(JSON.parse(JSON.stringify(base)));
  const totalW = rubric.criteria.reduce((s, c) => s + c.weight, 0);

  const patchCrit = (i, k, v) => { const n = { ...rubric, criteria: rubric.criteria.map((c, j) => j === i ? { ...c, [k]: v } : c) }; setRubric(n); };
  const addCrit = () => setRubric({ ...rubric, criteria: [...rubric.criteria, { name: 'Tiêu chí mới', weight: 0, desc: '' }] });
  const delCrit = (i) => setRubric({ ...rubric, criteria: rubric.criteria.filter((_, j) => j !== i) });

  return (
    <div style={{ padding: '22px 30px 40px', maxWidth: 1480, margin: '0 auto' }}>
      <div onClick={() => setRoute('rubrics')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Rubrics
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <input value={rubric.name} onChange={(e) => setRubric({ ...rubric, name: e.target.value })}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: serif, fontSize: 28, fontWeight: 600,
            color: p.ink, letterSpacing: -0.4 }} />
        <Btn p={p} variant="ghost" onClick={() => setRoute('rubrics')}>Huỷ</Btn>
        <Btn p={p} icon="check" onClick={() => { LMS && LMS.saveRubric(rubric); setRoute('rubrics'); }}>Lưu rubric</Btn>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        <div style={{ ...rCard(p, 16), flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ring value={totalW} size={48} thickness={6} p={p} color={totalW === 100 ? p.ok : p.warn} />
          <div><div style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>Tổng trọng số {totalW}%</div>
            <div style={{ fontSize: 11.5, color: totalW === 100 ? p.ok : p.warn }}>{totalW === 100 ? 'Hợp lệ' : 'Nên bằng 100%'}</div></div>
        </div>
        <div style={{ ...rCard(p, 16), flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: p.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="rubric" size={22} stroke={p.accent} /></div>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>{rubric.criteria.length} tiêu chí · {rubric.scale.length} mức</div>
            <div style={{ fontSize: 11.5, color: p.faint }}>Thang điểm 10</div></div>
        </div>
      </div>

      <section style={{ ...rCard(p, 22), marginBottom: 22 }}>
        <label style={lblStyle(p)}>TIÊU CHÍ ĐÁNH GIÁ</label>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rubric.criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, border: `1px solid ${p.line}`, background: p.raise }}>
              <Icon name="drag" size={16} stroke={p.faint} />
              <div style={{ flex: 1 }}>
                <input value={c.name} onChange={(e) => patchCrit(i, 'name', e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: p.ink, fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600 }} />
                <input value={c.desc} onChange={(e) => patchCrit(i, 'desc', e.target.value)} placeholder="Mô tả tiêu chí (tuỳ chọn)…"
                  style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: p.sub, fontFamily: FONTS.sans, fontSize: 12, marginTop: 3 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 12, border: `1px solid ${p.line}`, background: p.surface }}>
                <input type="number" value={c.weight} onChange={(e) => patchCrit(i, 'weight', Number(e.target.value))}
                  style={{ width: 40, border: 'none', outline: 'none', background: 'transparent', color: p.ink, fontFamily: FONTS.mono, fontSize: 14, textAlign: 'right' }} />
                <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: p.faint }}>%</span>
              </div>
              <IconBtn name="trash" p={p} size={36} onClick={() => delCrit(i)} />
            </div>
          ))}
        </div>
        <Btn p={p} variant="quiet" size="sm" icon="plus" style={{ marginTop: 12, paddingLeft: 0 }} onClick={addCrit}>Thêm tiêu chí</Btn>
      </section>

      <section style={rCard(p, 22)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <label style={lblStyle(p)}>MA TRẬN ĐIỂM (xem trước)</label>
          <Tag p={p} color={p.sub}>{rubric.scale.length} mức đánh giá</Tag>
        </div>
        <RubricMatrix rubric={rubric} p={p} mode="edit" />
      </section>
    </div>
  );
}
