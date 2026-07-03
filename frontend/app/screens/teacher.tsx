'use client';
import React from 'react';
import { Icon, Tag, Avatar, Btn, Stat } from '@/app/components/ui';
import { DB } from '@/app/store/store';
import { cardClass } from '@/app/helpers/shared';
import { useLmsAuth } from '@/app/contexts/AuthProvider';

export function TOverview({ p, t, setRoute, go }) {
  const auth = useLmsAuth();
  const ung = (aid) => DB.SUBMISSIONS.filter((s) => s.assignmentId === aid && s.status !== 'graded').length;
  const needGrading = DB.ASSIGNMENTS.filter((a) => ung(a.id) > 0);
  const shortcuts = [
    { icon: 'bank', label: 'Soạn câu hỏi', sub: 'Thêm vào ngân hàng', route: 'bank-edit' },
    { icon: 'docs', label: 'Tải tài liệu', sub: 'Lên kho học liệu', route: 'docs' },
    { icon: 'rubric', label: 'Tạo rubric', sub: 'Bộ tiêu chí mới', route: 'rubric-edit' },
    { icon: 'assign', label: 'Giao bài tập', sub: 'Phát cho lớp', route: 'assign-new' },
  ];
  return (
    <div className="mx-auto max-w-[1480px] px-[30px] lms-content-pad pt-[30px] pb-10">
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-2.5 font-mono text-[11.5px] tracking-wide text-lms-faint">THỨ HAI · 22 THÁNG 6, 2026</div>
          <h2 className="m-0 font-lms-heading text-[clamp(26px,7vw,38px)] font-medium leading-[1.05] tracking-[-0.6px] text-lms-ink">
            Chào buổi sáng, <span className="text-lms-accent">{auth.name || 'bạn'}.</span>
          </h2>
          <p className="mt-3 mb-0 max-w-[520px] text-[14.5px] leading-normal text-lms-sub">
            Hôm nay có <strong className="text-lms-ink">3 buổi dạy</strong> và <strong className="text-lms-ink">19 bài tập</strong> đang chờ chấm. Cùng bắt đầu một ngày hiệu quả nhé!
          </p>
        </div>
        <div className="flex gap-2.5">
          <Btn p={p} icon="plus" onClick={() => setRoute('assign-new')}>Giao bài tập</Btn>
          <Btn p={p} variant="ghost" icon="book" onClick={() => setRoute('docs')}>Kho học liệu</Btn>
        </div>
      </div>

      <div className={`lms-statstrip mb-6 flex py-[22px] ${cardClass(20)} p-0!`}>
        {[
          { l: 'Học viên đang dạy', v: '95', d: '4 lớp', sp: [8, 10, 9, 12, 11, 14, 13, 16] },
          { l: 'Bài tập đang mở', v: '4', d: '2 sắp đến hạn', sp: [5, 6, 6, 7, 9, 8, 10, 11] },
          { l: 'Bài chờ chấm', v: '19', d: 'Cần xử lý', sp: [12, 9, 14, 11, 16, 13, 18, 19] },
          { l: 'Tỷ lệ nộp bài', v: '86', u: '%', d: '↑ 3,2%', up: true, sp: [7, 8, 8, 9, 9, 10, 11, 12] },
        ].map((s, i) => (
          <div key={i} className={`flex-1 px-[26px] ${i ? 'border-l border-lms-line' : ''}`}>
            <Stat p={p} label={s.l} value={s.v} unit={s.u} delta={s.d} up={s.up} spark={s.sp} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] min-[961px]:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-[22px]">
          <section className={cardClass(20)}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 font-lms-heading text-xl font-medium text-lms-ink">Bài cần chấm</h3>
              <span onClick={() => setRoute('grade')} className="cursor-pointer font-mono text-[11.5px] text-lms-accent">Xem tất cả →</span>
            </div>
            <div className="flex flex-col">
              {needGrading.length === 0 && <div className="py-2.5 text-[13px] text-lms-faint">Tuyệt vời — không còn bài nào chờ chấm.</div>}
              {needGrading.map((a, i) => (
                <div key={a.id} onClick={() => go('grade-one', { assignment: a.id })} className={`lms-row flex cursor-pointer items-center gap-3.5 py-[13px] ${i ? 'border-t border-lms-line' : ''}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lms-accent-soft">
                    <Icon name="grade" size={19} stroke={p.accent} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-lms-ink">{a.title}</div>
                    <div className="mt-0.5 text-xs text-lms-faint">{a.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-lms-heading text-[22px] font-semibold leading-none text-lms-accent">{ung(a.id)}</div>
                    <div className="mt-[3px] font-mono text-[10.5px] text-lms-faint">chờ chấm</div>
                  </div>
                  <Icon name="chevronRight" size={18} stroke={p.faint} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-[22px]">
          <section className={cardClass(20)}>
            <h3 className="mb-4 mt-0 font-lms-heading text-xl font-medium text-lms-ink">Hoạt động</h3>
            {DB.NOTICES.map((n, i) => (
              <div key={i} className={`flex gap-3 py-3 ${i ? 'border-t border-lms-line' : ''}`}>
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-lms-sink">
                  <Icon name={n.icon} size={16} stroke={p.sub} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] leading-snug text-lms-ink">{n.title}</div>
                  <div className="mt-[3px] font-mono text-[11px] text-lms-faint">{n.time} · {n.tag}</div>
                </div>
              </div>
            ))}
          </section>

          <section className={cardClass(20)}>
            <h3 className="mb-4 mt-0 font-lms-heading text-xl font-medium text-lms-ink">Lối tắt</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {shortcuts.map((s) => (
                <div key={s.label} onClick={() => setRoute(s.route)} className="lms-row cursor-pointer rounded-xl border border-lms-line bg-lms-raise p-3.5">
                  <Icon name={s.icon} size={19} stroke={p.accent} />
                  <div className="mt-2.5 text-[13px] font-semibold text-lms-ink">{s.label}</div>
                  <div className="mt-0.5 text-[11px] text-lms-faint">{s.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AssignmentRow({ a, p, go }) {
  const tone = a.status === 'closing' ? p.warn : a.status === 'done' ? p.ok : p.accent;
  const toneBg = a.status === 'closing' ? 'bg-lms-warn/12' : a.status === 'done' ? 'bg-lms-ok/12' : 'bg-lms-accent-soft';
  const toneText = a.status === 'closing' ? 'text-lms-warn' : a.status === 'done' ? 'text-lms-ok' : 'text-lms-accent';
  return (
    <div className={`lms-card flex cursor-pointer items-center gap-4 bg-lms-surface border border-lms-line rounded-xl px-5 py-4`} onClick={() => go('grade-one', { assignment: a.id })}>
      <div className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl ${toneBg}`}>
        <Icon name="assign" size={20} stroke={tone} /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-lms-ink">{a.title}</div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-lms-sub">
          <span>{a.type}</span><span>· {a.questions} câu</span><span>· {a.points} điểm</span>
          <span className={`font-mono ${toneText}`}>· {a.dueIn}</span>
        </div>
      </div>
      <div className="lms-hide-xs min-w-[90px] text-center">
        <div className="font-mono text-[13px] text-lms-ink">{a.submitted}/{a.total}</div>
        <div className="text-[10.5px] text-lms-faint">đã nộp</div>
      </div>
      <div className="lms-hide-xs min-w-[90px] text-center">
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
    <div className={`lms-card cursor-pointer ${cardClass(16)}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-lms-accent-soft">
          <Icon name={ic} size={19} stroke={p.accent} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-snug text-lms-ink">{d.name}</div>
          <div className="mt-[3px] font-mono text-[11px] text-lms-faint">{d.type.toUpperCase()} · {d.size}</div>
        </div>
      </div>
    </div>
  );
}
