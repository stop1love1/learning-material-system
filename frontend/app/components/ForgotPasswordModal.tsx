'use client';
import React from 'react';
import type { Palette, Tweaks } from '@/app/types';
import { IconBtn, Field, Btn } from '@/app/components/ui';
import { lblClass } from '@/app/helpers/shared';
import { authApi, ApiError } from '@/app/lib/api';

/**
 * Forgot-password flow (in-app modal — no route).
 *  - step "request": enter email → authApi.forgotPassword. In dev (no SMTP) the
 *    response carries devToken/devResetLink, which we surface so the user can proceed.
 *  - step "reset": enter token + new password → authApi.resetPassword.
 *  - step "done": success message, with a button back to login.
 */
export function ForgotPasswordModal({
  p,
  t,
  onClose,
  onBackToLogin,
}: {
  p: Palette;
  t: Tweaks;
  onClose: () => void;
  onBackToLogin: () => void;
}) {
  const [step, setStep] = React.useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [devLink, setDevLink] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const friendly = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Có lỗi xảy ra';

  const requestReset = async () => {
    setErr('');
    if (!email.trim()) {
      setErr('Vui lòng nhập email');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.devToken) setToken(res.devToken);
      setDevLink(res.devResetLink ?? '');
      setStep('reset');
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    setErr('');
    if (!token.trim()) {
      setErr('Vui lòng nhập mã đặt lại');
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
      setStep('done');
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const onEnter = () => {
    if (busy) return;
    if (step === 'request') requestReset();
    else if (step === 'reset') doReset();
    else onBackToLogin();
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(10,12,16,0.5)] p-5 backdrop-blur-[3px]"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
          }
        }}
        className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-[18px] border border-lms-line bg-lms-surface p-7 shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
      >
        <div className="mb-[18px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-lms-accent font-lms-heading text-[19px] font-bold text-white">
              V
            </div>
            <div className="font-lms-heading text-base font-bold text-lms-ink">Vườn Văn</div>
          </div>
          <IconBtn name="x" p={p} size={32} onClick={onClose} />
        </div>

        <h2 className="m-0 mb-1 font-lms-heading text-[22px] font-extrabold tracking-[-0.4px] text-lms-ink">
          {step === 'done' ? 'Đặt lại mật khẩu thành công' : 'Quên mật khẩu'}
        </h2>
        <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
          {step === 'request'
            ? 'Nhập email của bạn để nhận mã đặt lại mật khẩu.'
            : step === 'reset'
              ? 'Nhập mã đặt lại và mật khẩu mới của bạn.'
              : 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.'}
        </p>

        {step === 'request' && (
          <>
            <label className={lblClass()}>EMAIL</label>
            <Field p={p} value={email} onChange={setEmail} placeholder="ban@email.com" icon="message" className="mt-2 mb-3.5" />
            {err && <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>}
            <Btn p={p} full size="lg" icon="send" onClick={requestReset}>
              {busy ? 'Đang xử lý…' : 'Gửi mã đặt lại'}
            </Btn>
            <p className="m-0 mt-[18px] text-center text-[13px] text-lms-sub">
              <span onClick={onBackToLogin} className="cursor-pointer font-bold text-lms-accent">
                Quay lại đăng nhập
              </span>
            </p>
          </>
        )}

        {step === 'reset' && (
          <>
            {devLink && (
              <div className="mb-3.5 rounded-[11px] border border-lms-line bg-lms-sink p-3">
                <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.5px] text-lms-faint">LIÊN KẾT ĐẶT LẠI (CHẾ ĐỘ DEV)</div>
                <a
                  href={devLink}
                  className="block break-all font-mono text-[11.5px] font-semibold text-lms-accent no-underline"
                >
                  {devLink}
                </a>
                <div className="mt-1.5 text-[11.5px] leading-normal text-lms-sub">
                  Đã điền sẵn mã từ liên kết — chỉ cần nhập mật khẩu mới bên dưới.
                </div>
              </div>
            )}
            <label className={lblClass()}>MÃ ĐẶT LẠI</label>
            <Field p={p} value={token} onChange={setToken} placeholder="Dán mã đặt lại" icon="target" mono className="mt-2 mb-3.5" />
            <label className={lblClass()}>MẬT KHẨU MỚI</label>
            <Field p={p} value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-3.5" />
            <label className={lblClass()}>NHẬP LẠI MẬT KHẨU MỚI</label>
            <Field p={p} value={pw2} onChange={setPw2} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-2" />
            {err && <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>}
            <Btn p={p} full size="lg" icon="check" onClick={doReset} className="mt-2">
              {busy ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
            </Btn>
            <p className="m-0 mt-[18px] text-center text-[13px] text-lms-sub">
              <span
                onClick={() => {
                  setErr('');
                  setToken('');
                  setPw('');
                  setPw2('');
                  setDevLink('');
                  setStep('request');
                }}
                className="cursor-pointer font-bold text-lms-accent"
              >
                Đổi email khác
              </span>
            </p>
          </>
        )}

        {step === 'done' && (
          <Btn p={p} full size="lg" icon="logout" onClick={onBackToLogin}>
            Đăng nhập
          </Btn>
        )}
      </div>
    </div>
  );
}
