'use client';
import React from 'react';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select } from '@/app/components/ui';
import { FONTS } from '@/app/theme/fonts';
import { hexA } from '@/app/theme/palette';
import { DB } from '@/app/data/db';
import { LMS } from '@/app/store/store';
import { lblStyle } from '@/app/helpers/shared';
import { articlesApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import RichEditor from '@/app/components/RichEditor';

const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const BLOG_COVER = {
  clay: { light: '#c2553e', dark: '#e0856b' }, teal: { light: '#0d8276', dark: '#46c2b1' },
  indigo: { light: '#4f4fcf', dark: '#9090ef' }, plum: { light: '#8a45c0', dark: '#bd8ae0' },
  blue: { light: '#1677ff', dark: '#5b8ff0' },
};
function coverHue(p, c) { return (BLOG_COVER[c] || BLOG_COVER.blue)[p.dark ? 'dark' : 'light']; }

function bgCard(p, pad = 20) { return { background: p.surface, border: `1px solid ${p.line}`, borderRadius: 12, padding: pad }; }

// ── Public blog list ─────────────────────────────────────────────────────────
export function SBlog({ p, t, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const cats = ['Tất cả', ...Array.from(new Set<string>(DB.ARTICLES.map((a: any) => a.cat)))];
  const [cat, setCat] = React.useState('Tất cả');
  const list = cat === 'Tất cả' ? DB.ARTICLES : DB.ARTICLES.filter((a) => a.cat === cat);
  const lead = list[0];
  const rest = list.slice(1);
  return (
    <div className="lms-content-pad" style={{ maxWidth: 1480, margin: '0 auto', padding: '36px 30px 8px' }}>
      <div className="reveal" style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 1, color: p.accent, marginBottom: 8 }}>BLOG · CHIA SẺ HỌC THUẬT</div>
        <h1 style={{ fontFamily: serif, fontSize: 34, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.8 }}>Bài viết & mẹo học Văn</h1>
        <p style={{ fontSize: 15, color: p.sub, margin: '10px 0 0', maxWidth: 560, lineHeight: 1.6 }}>
          Những bài viết về phương pháp học, kỹ năng viết văn và luyện từ — do thầy cô biên soạn chia sẻ.
        </p>
      </div>

      <div className="reveal" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0 22px' }}>
        {cats.map((c) => <Pill key={c} p={p} active={c === cat} onClick={() => setCat(c)}>{c}</Pill>)}
      </div>

      {lead && (
        <div onClick={() => go('article', { article: lead.id })} className="reveal bento-tile hovlift"
          style={{ overflow: 'hidden', cursor: 'pointer', border: `1px solid ${p.line}`, background: p.surface, display: 'grid', gridTemplateColumns: '1.1fr 1fr', marginBottom: 22 }}>
          <div style={{ minHeight: 240, background: `linear-gradient(135deg, ${coverHue(p, lead.cover)}, ${hexA(coverHue(p, lead.cover), 0.55)})`,
            display: 'flex', alignItems: 'flex-end', padding: 22 }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,.9)', color: coverHue(p, lead.cover), fontSize: 11.5, fontWeight: 700 }}>{lead.cat}</span>
          </div>
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.faint, marginBottom: 10 }}>BÀI NỔI BẬT</div>
            <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, margin: 0, color: p.ink, lineHeight: 1.25, letterSpacing: -0.4 }}>{lead.title}</h2>
            <p style={{ fontSize: 14, color: p.sub, lineHeight: 1.6, margin: '12px 0 18px' }}>{lead.excerpt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={lead.author} p={p} size={34} accent />
              <div><div style={{ fontSize: 12.5, fontWeight: 600, color: p.ink }}>{lead.author}</div>
                <div style={{ fontSize: 11.5, color: p.faint }}>{lead.date} · {lead.read} đọc</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 18, paddingBottom: 40 }}>
        {rest.map((a) => (
          <div key={a.id} onClick={() => go('article', { article: a.id })} className="bento-tile hovlift" style={{ overflow: 'hidden', cursor: 'pointer', border: `1px solid ${p.line}`, background: p.surface }}>
            <div style={{ height: 132, background: `linear-gradient(135deg, ${coverHue(p, a.cover)}, ${hexA(coverHue(p, a.cover), 0.5)})`, display: 'flex', alignItems: 'flex-end', padding: 14 }}>
              <span style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,.9)', color: coverHue(p, a.cover), fontSize: 11, fontWeight: 700 }}>{a.cat}</span>
            </div>
            <div style={{ padding: 18 }}>
              <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, margin: 0, color: p.ink, lineHeight: 1.3, letterSpacing: -0.2 }}>{a.title}</h3>
              <p style={{ fontSize: 13, color: p.sub, lineHeight: 1.55, margin: '8px 0 14px' }}>{a.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: p.faint }}>
                <Avatar name={a.author} p={p} size={26} /><span>{a.author}</span><span>·</span><span>{a.read}</span><span>·</span><span>👁 {a.views ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Public article reader ────────────────────────────────────────────────────
export function SArticle({ p, t, ctx, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const a = DB.ARTICLES.find((x) => x.id === ctx.article) || DB.ARTICLES[0];
  const hue = coverHue(p, a.cover);
  const more = DB.ARTICLES.filter((x) => x.id !== a.id).slice(0, 3);
  return (
    <div className="lms-content-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '28px 30px 8px' }}>
      <div onClick={() => setRoute('blog')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Blog
      </div>
      <span style={{ display: 'inline-block', padding: '4px 11px', borderRadius: 6, background: hexA(hue, 0.12), color: hue, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>{a.cat}</span>
      <h1 style={{ fontFamily: serif, fontSize: 34, fontWeight: 800, margin: 0, color: p.ink, letterSpacing: -0.8, lineHeight: 1.18 }}>{a.title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, margin: '20px 0 24px' }}>
        <Avatar name={a.author} p={p} size={42} accent />
        <div><div style={{ fontSize: 13.5, fontWeight: 600, color: p.ink }}>{a.author}</div>
          <div style={{ fontSize: 12, color: p.faint }}>{a.date} · {a.read} đọc</div></div>
      </div>
      <div style={{ height: 240, borderRadius: 14, background: `linear-gradient(135deg, ${hue}, ${hexA(hue, 0.5)})`, marginBottom: 28 }} />
      {a.html
        ? <div className="lms-rich" style={{ fontSize: 16.5, lineHeight: 1.95, color: p.ink }} dangerouslySetInnerHTML={{ __html: a.html }} />
        : <div>
            {(a.body || []).map((para, i) => (
              <p key={i} style={{ fontSize: 16.5, lineHeight: 1.95, color: p.ink, margin: '0 0 20px', textWrap: 'pretty' }}>{para}</p>
            ))}
          </div>}
      <div style={{ display: 'flex', gap: 10, padding: '22px 0', borderTop: `1px solid ${p.line}`, borderBottom: `1px solid ${p.line}`, margin: '8px 0 32px' }}>
        <Btn p={p} variant="soft" icon="book" onClick={() => setRoute('s-docs')}>Xem học liệu liên quan</Btn>
        <Btn p={p} variant="ghost" icon="assign" onClick={() => setRoute('s-tasks')}>Luyện bài tập</Btn>
      </div>
      <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: p.ink }}>Bài viết khác</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14, paddingBottom: 40 }}>
        {more.map((m) => (
          <div key={m.id} onClick={() => go('article', { article: m.id })} className="lms-card lms-row" style={{ ...bgCard(p, 14), cursor: 'pointer' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 5, background: hexA(coverHue(p, m.cover), 0.12), color: coverHue(p, m.cover), fontSize: 10.5, fontWeight: 700, marginBottom: 8 }}>{m.cat}</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: p.ink, lineHeight: 1.35 }}>{m.title}</div>
            <div style={{ fontSize: 11.5, color: p.faint, marginTop: 8 }}>{m.read} đọc</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin: manage + compose blog ─────────────────────────────────────────────
export function ABlog({ p, t, setRoute, go }) {
  const serif = FONTS.heading[t.headingFont] || FONTS.display;
  const [mode, setMode] = React.useState('list'); // list | compose
  const [editId, setEditId] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('Tập làm văn');
  const [body, setBody] = React.useState('');
  const [kw, setKw] = React.useState('');
  const cats = ['Tập làm văn', 'Luyện từ & câu', 'Chính tả', 'Cùng con học', 'Tin tức'];
  // Mở trình soạn cho bài mới (a=null) hoặc sửa bài có sẵn (prefill từ a).
  const openCompose = (a) => {
    setEditId(a ? a.id : null);
    setTitle(a ? a.title || '' : '');
    setCat(a ? a.cat || 'Tập làm văn' : 'Tập làm văn');
    setBody(a ? a.html || '' : '');
    setMode('compose');
  };

  if (mode === 'compose') {
    return (
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '22px 30px 40px' }}>
        <div onClick={() => setMode('list')} className="lms-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: p.sub, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
          <Icon name="arrowLeft" size={16} stroke={p.sub} /> Quản lý bài viết
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' }}>
          <section style={bgCard(p, 24)}>
            <label style={lblStyle(p)}>TIÊU ĐỀ</label>
            <Field p={p} value={title} onChange={setTitle} placeholder="vd: Cách giúp con viết mở bài tả con vật" style={{ marginTop: 8, marginBottom: 18 }} />
            <label style={lblStyle(p)}>CHUYÊN MỤC</label>
            <Select p={p} value={cat} onChange={setCat} style={{ marginTop: 8, marginBottom: 18, maxWidth: 280 }} options={cats} />
            <label style={lblStyle(p)}>NỘI DUNG</label>
            <div style={{ marginTop: 8 }}>
              <RichEditor value={body} onChange={setBody} placeholder="Soạn nội dung bài viết…" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn p={p} variant="ghost" onClick={() => setMode('list')}>Huỷ</Btn>
              <Btn p={p} icon="send" onClick={async () => {
                const safeTitle = title || 'Bài viết mới';
                const plain = stripHtml(body);
                try {
                  // content is stored as HTML (authored in CKEditor).
                  if (editId) {
                    await articlesApi.update(editId, { title: safeTitle, category: cat, content: body, excerpt: plain.slice(0, 110) });
                  } else {
                    await articlesApi.create({ title: safeTitle, category: cat, content: body, excerpt: plain.slice(0, 110), cover: 'blue' });
                  }
                  await hydrateFor('a-blog'); // re-runs loadArticles → DB.ARTICLES from backend
                } catch {
                  // offline / logged-out fallback: optimistic mock insert
                  if (!editId) LMS && LMS.addArticle({ title: safeTitle, cat, body: plain ? [plain] : ['(Chưa có nội dung)'], cover: 'blue' });
                } finally {
                  setMode('list'); setTitle(''); setBody(''); setEditId(null);
                }
              }}>{editId ? 'Lưu thay đổi' : 'Đăng bài'}</Btn>
            </div>
          </section>
          <div style={{ position: 'sticky', top: 0 }}>
            <div style={bgCard(p, 22)}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 0.5, color: p.faint, marginBottom: 14 }}>XEM TRƯỚC</div>
              <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 6, background: p.accentSoft, color: p.accent, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>{cat}</span>
              <h2 style={{ fontFamily: serif, fontSize: 21, fontWeight: 700, margin: 0, color: title ? p.ink : p.faint, lineHeight: 1.3 }}>{title || 'Tiêu đề bài viết…'}</h2>
              <div style={{ fontSize: 12, color: p.faint, margin: '10px 0 14px' }}>Quản trị · Hôm nay</div>
              {body
                ? <div className="lms-rich" style={{ fontSize: 13.5, lineHeight: 1.7, color: p.sub }} dangerouslySetInnerHTML={{ __html: body }} />
                : <p style={{ fontSize: 13.5, lineHeight: 1.7, color: p.faint }}>Nội dung bài viết sẽ hiển thị ở đây…</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 30px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <Field p={p} icon="search" value={kw} onChange={setKw} placeholder="Tìm bài viết…" style={{ width: 280 }} />
        <div style={{ flex: 1 }} />
        <Btn p={p} icon="plus" onClick={() => openCompose(null)}>Viết bài mới</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
        {DB.ARTICLES.filter((a) => { const k = kw.trim().toLowerCase(); return !k || (a.title || '').toLowerCase().includes(k) || (a.cat || '').toLowerCase().includes(k); }).map((a) => (
          <div key={a.id} className="lms-card" style={{ ...bgCard(p, 0), overflow: 'hidden' }}>
            <div style={{ height: 90, background: `linear-gradient(135deg, ${coverHue(p, a.cover)}, ${hexA(coverHue(p, a.cover), 0.5)})`, display: 'flex', alignItems: 'flex-end', padding: 12 }}>
              <span style={{ padding: '3px 9px', borderRadius: 5, background: 'rgba(255,255,255,.9)', color: coverHue(p, a.cover), fontSize: 10.5, fontWeight: 700 }}>{a.cat}</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: p.ink, lineHeight: 1.35 }}>{a.title}</div>
              <div style={{ fontSize: 11.5, color: p.faint, margin: '8px 0 12px' }}>{a.author} · {a.date} · 👁 {a.views ?? 0}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn p={p} variant="ghost" size="sm" icon="pen" onClick={() => openCompose(a)}>Sửa</Btn>
                <Btn p={p} variant="ghost" size="sm" icon="eye" onClick={() => go && go('article', { article: a.id })}>Xem</Btn>
                <div style={{ flex: 1 }} />
                <Tag p={p} color={p.ok}>Đã đăng</Tag>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
