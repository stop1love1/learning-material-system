'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon, Tag, Pill, Avatar, Btn, Field, Select, EmptyState } from '@/app/components/ui';
import { hexA } from '@/app/theme/palette';
import { DB, LMS, useLMS } from '@/app/store/store';
import { lblClass, cardClass } from '@/app/helpers/shared';
import { articlesApi } from '@/app/lib/api';
import { hydrateFor } from '@/app/lib/sync/hydrate';
import RichEditor from '@/app/components/RichEditor';
import { Pagination } from '@/app/components/Pagination';
import { usePagedResource } from '@/app/lib/paged/usePagedResource';
import { mapArticle, loadArticle } from '@/app/lib/sync/load-articles';
import { ROUTES } from '@/app/configs/routes.config';
import { withKeyword } from '@/app/helpers/related-href';
import { toastError } from '@/app/lib/ui/dialogs';

const stripHtml = (h) => (h || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const BLOG_COVER = {
  clay: { light: '#c2553e', dark: '#e0856b' }, teal: { light: '#0d8276', dark: '#46c2b1' },
  indigo: { light: '#4f4fcf', dark: '#9090ef' }, plum: { light: '#8a45c0', dark: '#bd8ae0' },
  blue: { light: '#1677ff', dark: '#5b8ff0' },
};
function coverHue(p, c) { return (BLOG_COVER[c] || BLOG_COVER.blue)[p.dark ? 'dark' : 'light']; }
/** Ảnh bìa dạng biểu tượng minh hoạ (nền trong suốt: .svg hoặc bộ emoji hoạt hình)
 *  → canh giữa trên thẻ màu pastel; còn lại coi là ảnh chụp → phủ kín. */
function isIconCover(url) {
  return /\.svg(\?|$)/i.test(url) || /(fluentui-emoji|openmoji|twemoji)/i.test(url);
}
/** Nền của khối ảnh bìa: ảnh chụp phủ kín kèm lớp hue nhạt, biểu tượng canh giữa
 *  trên thẻ màu, fallback về gradient theo hue khi bài viết chưa có ảnh. */
function coverStyle(p, a) {
  const hue = coverHue(p, a.cover);
  const img = a && a.image;
  if (img && isIconCover(img)) {
    return {
      backgroundColor: hexA(hue, 0.14),
      backgroundImage: `url("${img}")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'auto 72%',
    };
  }
  if (img) {
    return {
      backgroundImage: `linear-gradient(135deg, ${hexA(hue, 0.28)}, ${hexA(hue, 0.12)}), url("${img}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: `linear-gradient(135deg, ${hue}, ${hexA(hue, 0.5)})` };
}

export function SBlog({ p, t }) {
  useLMS();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cats = ['Tất cả', ...Array.from(new Set<string>(DB.ARTICLES.map((a: any) => a.cat)))];
  const rawTab = searchParams.get('activeTab');
  const cat = !rawTab ? 'Tất cả' : rawTab;

  const paged = usePagedResource<any>({ fetcher: articlesApi.list, mapper: mapArticle });
  const { records: list, loading, error } = paged;

  const setCat = React.useCallback((c: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (c === 'Tất cả') params.delete('activeTab');
    else params.set('activeTab', c);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    paged.setFilter('category', c === 'Tất cả' ? '' : c);
  }, [pathname, router, searchParams, paged]);

  React.useEffect(() => {
    paged.setFilter('category', cat === 'Tất cả' ? '' : cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  const onFirstPage = paged.current <= 1;
  const lead = onFirstPage ? list[0] : undefined;
  const rest = onFirstPage ? list.slice(1) : list;
  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-9 pb-2">
      <div className="reveal mb-2">
        <div className="mb-2 font-mono text-[11.5px] tracking-wide text-lms-accent">BLOG · CHIA SẺ HỌC THUẬT</div>
        <h1 className="m-0 font-lms-heading text-[clamp(24px,6vw,34px)] font-extrabold tracking-[-0.8px] text-lms-ink">Bài viết & mẹo học tập</h1>
        <p className="mt-2.5 mb-0 w-full text-[15px] leading-relaxed text-lms-sub">
          Những bài viết về phương pháp học tập và kỹ năng học tốt các môn — do thầy cô biên soạn chia sẻ.
        </p>
      </div>

      <div className="reveal my-6 flex flex-wrap items-center gap-2">
        {cats.map((c) => <Pill key={c} p={p} active={c === cat} onClick={() => setCat(c)}>{c}</Pill>)}
        <div className="flex-1" />
        <Field p={p} icon="search" value={paged.keyword} onChange={paged.setKeyword} placeholder="Tìm bài viết…" className="w-[240px]" />
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">Đang tải…</div>
      ) : list.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-lms-faint">{error ? 'Không tải được dữ liệu' : 'Không có kết quả'}</div>
      ) : (
      <>
      {lead && (
        <Link href={ROUTES.blogPost(lead.id)} className="reveal bento-tile hovlift mb-[22px] grid grid-cols-1 min-[720px]:grid-cols-[1.1fr_1fr] overflow-hidden border border-lms-line bg-lms-surface no-underline">
          <div className="flex min-h-[240px] items-end p-[22px]" style={coverStyle(p, lead)}>
            <span className="rounded-md bg-white/90 px-2.5 py-1 text-[11.5px] font-bold" style={{ color: coverHue(p, lead.cover) }}>{lead.cat}</span>
          </div>
          <div className="flex flex-col justify-center p-7">
            <div className="mb-2.5 font-mono text-[11px] text-lms-faint">BÀI NỔI BẬT</div>
            <h2 className="m-0 font-lms-heading text-2xl font-bold leading-snug tracking-[-0.4px] text-lms-ink">{lead.title}</h2>
            <p className="my-3 text-sm leading-relaxed text-lms-sub">{lead.excerpt}</p>
            <div className="flex items-center gap-2.5">
              <Avatar name={lead.author} p={p} size={34} accent />
              <div><div className="text-[12.5px] font-semibold text-lms-ink">{lead.author}</div>
                <div className="text-[11.5px] text-lms-faint">{lead.date} · {lead.read} đọc</div></div>
            </div>
          </div>
        </Link>
      )}

      <div className="lms-stagger reveal grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px] pb-10">
        {rest.map((a) => (
          <Link key={a.id} href={ROUTES.blogPost(a.id)} className="bento-tile hovlift overflow-hidden border border-lms-line bg-lms-surface no-underline">
            <div className="flex h-[132px] items-end p-3.5" style={coverStyle(p, a)}>
              <span className="rounded-md bg-white/90 px-[9px] py-[3px] text-[11px] font-bold" style={{ color: coverHue(p, a.cover) }}>{a.cat}</span>
            </div>
            <div className="p-[18px]">
              <h3 className="m-0 font-lms-heading text-lg font-bold leading-snug tracking-[-0.2px] text-lms-ink">{a.title}</h3>
              <p className="my-2 text-[13px] leading-snug text-lms-sub">{a.excerpt}</p>
              <div className="flex items-center gap-2 text-[11.5px] text-lms-faint">
                <Avatar name={a.author} p={p} size={26} /><span>{a.author}</span><span>·</span><span>{a.read}</span><span>·</span><span>👁 {a.views ?? 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </>
      )}
      <Pagination current={paged.current} pages={paged.pages} total={paged.total} pageSize={paged.pageSize} onChange={paged.setPage} p={p} />
    </div>
  );
}

export function SArticle({ p, t, ctx }) {
  useLMS();
  const id = ctx.article;
  // Fetch the exact article by id on mount: this both loads articles missing
  // from the first-100 list AND triggers the backend viewCount $inc (GET /:id).
  const [loading, setLoading] = React.useState(() => !DB.ARTICLES.find((x: any) => x.id === id));
  React.useEffect(() => {
    let alive = true;
    if (!DB.ARTICLES.find((x: any) => x.id === id)) setLoading(true);
    loadArticle(id).finally(() => {
      if (!alive) return;
      LMS.bump();
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  const a = DB.ARTICLES.find((x) => x.id === id);
  // Still fetching and nothing to show yet: render the loading state rather than
  // an unrelated article. A genuinely missing id resolves to the not-found state.
  if (loading && !a) return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3.5">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-lms-line border-t-lms-accent" />
        <span className="text-[13px] text-lms-sub">Đang tải bài viết…</span>
      </div>
    </div>
  );
  if (!a) return (
    <EmptyState
      p={p}
      icon="docs"
      label="Không tìm thấy bài viết"
      sub="Bài viết không tồn tại hoặc đã bị gỡ."
      action={(
        <Link href={ROUTES.blog} className="lms-btn mt-1 inline-flex h-[34px] items-center gap-2 rounded-[11px] bg-lms-accent-soft px-3.5 text-[12.5px] font-semibold text-lms-accent no-underline">
          <Icon name="arrowLeft" size={15} stroke={p.accent} sw={1.9} /> Về blog
        </Link>
      )}
    />
  );
  const hue = coverHue(p, a.cover);
  const more = DB.ARTICLES.filter((x) => x.id !== a.id).slice(0, 3);
  // "Liên quan" = lọc trang đích theo tag của bài viết (fallback: chuyên mục),
  // qua ?q= mà usePagedResource tự đọc — thay vì mở full danh sách.
  const relatedKw = (Array.isArray(a.tags) && a.tags[0]) || a.cat || '';
  return (
    <div className="lms-content-pad mx-auto max-w-[760px] px-[30px] pt-7 pb-2">
      <Link href={ROUTES.blog} className="lms-link mb-5 inline-flex items-center gap-1.5 text-[13px] text-lms-sub no-underline">
        <Icon name="arrowLeft" size={16} stroke={p.sub} /> Blog
      </Link>
      <span className="mb-3.5 inline-block rounded-md px-[11px] py-1 text-xs font-bold" style={{ background: hexA(hue, 0.12), color: hue }}>{a.cat}</span>
      <h1 className="m-0 font-lms-heading text-[clamp(24px,6vw,34px)] font-extrabold leading-[1.18] tracking-[-0.8px] text-lms-ink">{a.title}</h1>
      <div className="my-5 flex items-center gap-[11px]">
        <Avatar name={a.author} p={p} size={42} accent />
        <div><div className="text-[13.5px] font-semibold text-lms-ink">{a.author}</div>
          <div className="text-xs text-lms-faint">{a.date} · {a.read} đọc</div></div>
      </div>
      <div className="mb-7 h-[240px] rounded-[14px]" style={coverStyle(p, a)} />
      {a.html
        ? <div className="lms-rich text-[16.5px] leading-[1.95] text-lms-ink" dangerouslySetInnerHTML={{ __html: a.html }} />
        : <div>
            {(a.body || []).map((para, i) => (
              <p key={i} className="mb-5 mt-0 text-[16.5px] leading-[1.95] text-pretty text-lms-ink">{para}</p>
            ))}
          </div>}
      <div className="my-2 flex flex-wrap gap-2.5 border-y border-lms-line py-[22px]">
        <Link href={withKeyword(ROUTES.library, relatedKw)} className="lms-btn inline-flex h-10 items-center gap-2 rounded-[11px] bg-lms-accent-soft px-[18px] text-[13.5px] font-semibold text-lms-accent no-underline">
          <Icon name="book" size={16} stroke={p.accent} sw={1.9} /> Xem học liệu liên quan
        </Link>
        <Link href={withKeyword(ROUTES.practice, relatedKw)} className="lms-btn inline-flex h-10 items-center gap-2 rounded-[11px] border border-lms-line bg-lms-surface px-[18px] text-[13.5px] font-semibold text-lms-ink no-underline">
          <Icon name="assign" size={16} stroke={p.sub} sw={1.9} /> Luyện bài tập
        </Link>
      </div>
      <h3 className="mb-4 mt-0 font-lms-heading text-xl font-bold text-lms-ink">Bài viết khác</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 pb-10">
        {more.map((m) => (
          <Link key={m.id} href={ROUTES.blogPost(m.id)} className={`lms-card lms-row ${cardClass(16)} p-3.5! no-underline`}>
            <span className="mb-2 inline-block rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: hexA(coverHue(p, m.cover), 0.12), color: coverHue(p, m.cover) }}>{m.cat}</span>
            <div className="text-sm font-semibold leading-snug text-lms-ink">{m.title}</div>
            <div className="mt-2 text-[11.5px] text-lms-faint">{m.read} đọc</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ABlog({ p, t, setRoute }) {
  const [mode, setMode] = React.useState('list');
  const [editId, setEditId] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('Hoạt động Viết');
  const [body, setBody] = React.useState('');
  const [image, setImage] = React.useState('');
  const [kw, setKw] = React.useState('');
  const cats = ['Giới thiệu học liệu', 'Hoạt động Viết', 'Luyện từ & câu', 'Cùng con học', 'Tin tức'];
  const openCompose = (a) => {
    setEditId(a ? a.id : null);
    setTitle(a ? a.title || '' : '');
    setCat(a ? a.cat || 'Hoạt động Viết' : 'Hoạt động Viết');
    setBody(a ? a.html || '' : '');
    setImage(a ? a.image || '' : '');
    setMode('compose');
  };

  if (mode === 'compose') {
    return (
      <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-[22px] pb-10">
        <div onClick={() => setMode('list')} className="lms-link mb-4 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-lms-sub">
          <Icon name="arrowLeft" size={16} stroke={p.sub} /> Quản lý bài viết
        </div>
        <div className="grid grid-cols-1 items-start gap-6 min-[961px]:grid-cols-[1.5fr_1fr]">
          <section className={cardClass(24)}>
            <label className={lblClass()}>TIÊU ĐỀ</label>
            <Field p={p} value={title} onChange={setTitle} placeholder="vd: Cách giúp con viết mở bài tả con vật" className="mt-2 mb-[18px]" />
            <label className={lblClass()}>CHUYÊN MỤC</label>
            <Select p={p} value={cat} onChange={setCat} className="mt-2 mb-[18px] max-w-[280px]" options={cats} />
            <label className={lblClass()}>ẢNH BÌA (URL)</label>
            <Field p={p} icon="image" value={image} onChange={setImage} placeholder="https://… (dán link ảnh; để trống sẽ dùng nền mặc định)" className="mt-2 mb-[18px]" />
            <label className={lblClass()}>NỘI DUNG</label>
            <div className="mt-2">
              <RichEditor value={body} onChange={setBody} placeholder="Soạn nội dung bài viết…" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <Btn p={p} variant="ghost" onClick={() => setMode('list')}>Huỷ</Btn>
              <Btn p={p} icon="send" onClick={async () => {
                const safeTitle = title || 'Bài viết mới';
                const plain = stripHtml(body);
                const images = image.trim() ? [image.trim()] : [];
                try {
                  if (editId) {
                    await articlesApi.update(editId, { title: safeTitle, category: cat, content: body, excerpt: plain.slice(0, 110), images });
                  } else {
                    await articlesApi.create({ title: safeTitle, category: cat, content: body, excerpt: plain.slice(0, 110), cover: 'blue', images });
                  }
                  await hydrateFor('a-blog');
                  setMode('list'); setTitle(''); setBody(''); setImage(''); setEditId(null);
                } catch (e: any) {
                  toastError(e?.message || 'Không đăng được bài viết. Vui lòng thử lại.');
                }
              }}>{editId ? 'Lưu thay đổi' : 'Đăng bài'}</Btn>
            </div>
          </section>
          <div className="sticky top-0">
            <div className={cardClass(20)}>
              <div className="mb-3.5 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">XEM TRƯỚC</div>
              <div className="mb-3 h-[120px] overflow-hidden rounded-[10px]" style={coverStyle(p, { cover: 'blue', image: image.trim() })} />
              <span className="mb-2.5 inline-block rounded-md bg-lms-accent-soft px-[9px] py-[3px] text-[11px] font-bold text-lms-accent">{cat}</span>
              <h2 className={`m-0 font-lms-heading text-[21px] font-bold leading-snug ${title ? 'text-lms-ink' : 'text-lms-faint'}`}>{title || 'Tiêu đề bài viết…'}</h2>
              <div className="my-2.5 text-xs text-lms-faint">Quản trị · Hôm nay</div>
              {body
                ? <div className="lms-rich text-[13.5px] leading-[1.7] text-lms-sub" dangerouslySetInnerHTML={{ __html: body }} />
                : <p className="text-[13.5px] leading-[1.7] text-lms-faint">Nội dung bài viết sẽ hiển thị ở đây…</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lms-content-pad mx-auto max-w-[1480px] px-[30px] pt-6 pb-10">
      <div className="mb-[22px] flex items-center gap-2.5">
        <Field p={p} icon="search" value={kw} onChange={setKw} placeholder="Tìm bài viết…" className="min-w-0 flex-1" />
        <Btn p={p} icon="plus" onClick={() => openCompose(null)}>Viết bài mới</Btn>
      </div>
      <div className="lms-stagger grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {DB.ARTICLES.filter((a) => { const k = kw.trim().toLowerCase(); return !k || (a.title || '').toLowerCase().includes(k) || (a.cat || '').toLowerCase().includes(k); }).map((a) => (
          <div key={a.id} className={`lms-card overflow-hidden ${cardClass(16)} p-0!`}>
            <div className="flex h-[90px] items-end p-3" style={coverStyle(p, a)}>
              <span className="rounded-[5px] bg-white/90 px-[9px] py-[3px] text-[10.5px] font-bold" style={{ color: coverHue(p, a.cover) }}>{a.cat}</span>
            </div>
            <div className="p-4">
              <div className="text-[14.5px] font-semibold leading-snug text-lms-ink">{a.title}</div>
              <div className="my-2 text-[11.5px] text-lms-faint">{a.author} · {a.date} · 👁 {a.views ?? 0}</div>
              <div className="flex gap-2">
                <Btn p={p} variant="ghost" size="sm" icon="pen" onClick={() => openCompose(a)}>Sửa</Btn>
                <Link href={ROUTES.blogPost(a.id)} className="lms-btn inline-flex h-[34px] items-center gap-2 rounded-[11px] border border-lms-line bg-lms-surface px-3 text-[12.5px] font-semibold text-lms-ink no-underline">
                  <Icon name="eye" size={15} stroke={p.sub} sw={1.9} /> Xem
                </Link>
                <div className="flex-1" />
                <Tag p={p} color={p.ok}>Đã đăng</Tag>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
