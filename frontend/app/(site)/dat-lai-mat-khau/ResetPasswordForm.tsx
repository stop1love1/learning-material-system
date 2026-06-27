'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Field, Btn } from '@/app/components/ui';
import { lblClass } from '@/app/helpers/shared';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { authApi, ApiError } from '@/app/lib/api';

/**
 * Standalone reset-password form reached via the email link
 * `${FRONTEND_URL}/dat-lai-mat-khau?token=<raw>`. Reads `token` from the query
 * (client-only — wrapped in <Suspense> by the page) and posts to
 * authApi.resetPassword. On success shows a confirmation with a link home.
 */
export function ResetPasswordForm() {
  const { p } = useLmsTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const friendly = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Có lỗi xảy ra';

  const doReset = async () => {
    setErr('');
    if (!token.trim()) {
      setErr('Liên kết không hợp lệ hoặc thiếu mã đặt lại.');
      return;
    }
    if (pw.length < 6) {
      setErr('Mật khẩu cần ít nhất 6 ký tự');
      return;
    }
    if (pw !== pw2) {
      setErr('Mật khẩu nhập lại không khớp');
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword(token.trim(), pw);
      setDone(true);
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-5 font-sans">
      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy && !done) {
            e.preventDefault();
            doReset();
          }
        }}
        className="w-full max-w-[420px] rounded-[18px] border border-lms-line bg-lms-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.12)]"
      >
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent font-lms-heading text-[19px] font-bold text-white">
            V
          </div>
          <div className="font-lms-heading text-base font-bold text-lms-ink">Vườn Văn</div>
        </div>

        <h1 className="m-0 mb-1 font-lms-heading text-[22px] font-extrabold tracking-[-0.4px] text-lms-ink">
          {done ? 'Đặt lại mật khẩu thành công' : 'Đặt lại mật khẩu'}
        </h1>
        <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
          {done
            ? 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.'
            : 'Nhập mật khẩu mới cho tài khoản của bạn.'}
        </p>

        {done ? (
          <Link href="/" className="block no-underline">
            <Btn p={p} full size="lg" icon="logout">
              Về trang chủ
            </Btn>
          </Link>
        ) : (
          <>
            <label className={lblClass()}>MẬT KHẨU MỚI</label>
            <Field p={p} value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-3.5" />
            <label className={lblClass()}>NHẬP LẠI MẬT KHẨU MỚI</label>
            <Field p={p} value={pw2} onChange={setPw2} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-2" />
            {err && <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>}
            <Btn p={p} full size="lg" icon="check" onClick={doReset} className="mt-2">
              {busy ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
            </Btn>
            <p className="m-0 mt-[18px] text-center text-[13px] text-lms-sub">
              <Link href="/" className="font-bold text-lms-accent no-underline">
                Về trang chủ
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
