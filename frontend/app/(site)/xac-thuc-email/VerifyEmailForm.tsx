'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Btn } from '@/app/components/ui';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { authApi, setToken, ApiError } from '@/app/lib/api';

/**
 * Standalone email-verification screen reached via the link in the verification
 * email `${FRONTEND_URL}/xac-thuc-email?token=<raw>`. Reads `token` from the query
 * (client-only — wrapped in <Suspense> by the page), posts it to
 * authApi.verifyEmail on mount, and on success stores the returned accessToken
 * (auto-login) and shows a confirmation with a link home.
 */
export function VerifyEmailForm() {
  const { p } = useLmsTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  // 'pending' while verifying, then 'done' or 'error'.
  const [status, setStatus] = React.useState<'pending' | 'done' | 'error'>('pending');
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (!token.trim()) {
      setErr('Liên kết không hợp lệ hoặc thiếu mã xác thực.');
      setStatus('error');
      return;
    }
    let cancelled = false;
    authApi
      .verifyEmail(token.trim())
      .then((res) => {
        if (cancelled) return;
        setToken(res.accessToken);
        setStatus('done');
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Có lỗi xảy ra');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-5 font-sans">
      <div className="w-full max-w-[420px] rounded-[18px] border border-lms-line bg-lms-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent font-lms-heading text-[19px] font-bold text-white">
            V
          </div>
          <div className="font-lms-heading text-base font-bold text-lms-ink">Vườn Văn</div>
        </div>

        <h1 className="m-0 mb-1 font-lms-heading text-[22px] font-extrabold tracking-[-0.4px] text-lms-ink">
          {status === 'done' ? 'Xác thực thành công' : status === 'error' ? 'Không thể xác thực' : 'Đang xác thực…'}
        </h1>
        <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
          {status === 'done'
            ? 'Xác thực thành công! Tài khoản đã kích hoạt.'
            : status === 'error'
              ? 'Liên kết có thể đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để nhận liên kết xác thực mới.'
              : 'Vui lòng đợi trong giây lát.'}
        </p>

        {status === 'error' && err && (
          <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>
        )}

        {status !== 'pending' && (
          <Link href="/" className="block no-underline">
            <Btn p={p} full size="lg" icon="logout">
              Về trang chủ
            </Btn>
          </Link>
        )}
      </div>
    </div>
  );
}
