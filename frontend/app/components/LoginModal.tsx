'use client';
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { Auth, Palette, Tweaks } from '@/app/types';
import { IconBtn, Field, Btn } from '@/app/components/ui';
import { lblClass } from '@/app/helpers/shared';
import { ForgotPasswordModal } from '@/app/components/ForgotPasswordModal';
import { authApi, ApiError } from '@/app/lib/api';

const GOOGLE_ENABLED = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function LoginModal({ p, t, auth, onClose }: { p: Palette; t: Tweaks; auth: Auth; onClose: () => void }) {
  const [tab, setTab] = React.useState('login');
  const [forgot, setForgot] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const reg = tab === 'register';
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  // After a successful register: show a "check your email" view instead of the form.
  const [sent, setSent] = React.useState<null | { devVerifyLink?: string }>(null);
  // When login fails because the email is unverified, expose a "resend" action.
  const [needsVerify, setNeedsVerify] = React.useState(false);
  const [resent, setResent] = React.useState<null | { devVerifyLink?: string }>(null);

  const friendly = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Có lỗi xảy ra';

  const submit = async () => {
    setErr('');
    setNeedsVerify(false);
    setResent(null);
    setBusy(true);
    try {
      if (reg) {
        if (pw !== pw2) throw new Error('Mật khẩu nhập lại không khớp');
        const res = await auth.register(name, email, pw);
        setSent({ devVerifyLink: res?.devVerifyLink });
      } else {
        await auth.login(email, pw);
      }
    } catch (e) {
      const msg = friendly(e);
      setErr(msg);
      // 403 "email chưa được xác thực" → offer to resend the verification link.
      if (msg.includes('xác thực')) setNeedsVerify(true);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setErr('');
    setNeedsVerify(false);
    setBusy(true);
    try {
      await auth.googleLogin(credential);
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setErr('');
    setBusy(true);
    try {
      const res = await authApi.resendVerification(email);
      setResent({ devVerifyLink: res.devVerifyLink });
    } catch (e) {
      setErr(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const backToLogin = () => {
    setSent(null);
    setNeedsVerify(false);
    setResent(null);
    setErr('');
    setPw('');
    setPw2('');
    setTab('login');
  };
  const tabBtn = (id: string, label: string) => {
    const on = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className={`h-[38px] flex-1 cursor-pointer rounded-[9px] border-0 font-sans text-[13.5px] transition-all duration-150 ${
          on ? 'bg-lms-surface font-bold text-lms-ink shadow-[0_1px_3px_rgba(15,23,38,0.12)]' : 'bg-transparent font-medium text-lms-sub'
        }`}
      >
        {label}
      </button>
    );
  };
  if (forgot) {
    return (
      <ForgotPasswordModal
        p={p}
        t={t}
        onClose={onClose}
        onBackToLogin={() => {
          setForgot(false);
          setTab('login');
        }}
      />
    );
  }
  // Post-register: "check your email" view.
  if (sent) {
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
            Kiểm tra email của bạn
          </h2>
          <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
            Đã gửi liên kết xác thực tới <b className="text-lms-ink">{email}</b>. Mở email và bấm liên kết để kích hoạt
            tài khoản.
          </p>
          {sent.devVerifyLink && (
            <p className="m-0 mb-4 break-all text-[12px] leading-normal text-lms-sub">
              Chế độ dev (chưa cấu hình email):{' '}
              <a href={sent.devVerifyLink} className="font-semibold text-lms-accent underline">
                bấm vào đây để xác thực
              </a>
            </p>
          )}
          <Btn p={p} full size="lg" icon="logout" onClick={backToLogin}>
            Quay lại đăng nhập
          </Btn>
        </div>
      </div>
    );
  }
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
          if (e.key === 'Enter' && !busy) {
            e.preventDefault();
            submit();
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
          {reg ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
        </h2>
        <p className="m-0 mb-[18px] text-[13px] leading-normal text-lms-sub">
          {reg ? 'Đăng ký miễn phí để làm bài tập và lưu tiến độ học.' : 'Đăng nhập để làm bài tập và xem phiếu học tập.'}
        </p>

        <div className="mb-5 flex gap-1 rounded-[11px] border border-lms-line bg-lms-sink p-1">
          {tabBtn('login', 'Đăng nhập')}
          {tabBtn('register', 'Đăng ký')}
        </div>

        {reg && (
          <>
            <label className={lblClass()}>HỌ VÀ TÊN</label>
            <Field p={p} value={name} onChange={setName} placeholder="Nguyễn Văn A" icon="users" className="mt-2 mb-3.5" />
          </>
        )}
        <label className={lblClass()}>EMAIL</label>
        <Field p={p} value={email} onChange={setEmail} placeholder="ban@email.com" icon="message" className="mt-2 mb-3.5" />
        <label className={lblClass()}>MẬT KHẨU</label>
        <Field p={p} value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="target" className={`mt-2 ${reg ? 'mb-3.5' : 'mb-2'}`} />
        {reg && (
          <>
            <label className={lblClass()}>NHẬP LẠI MẬT KHẨU</label>
            <Field p={p} value={pw2} onChange={setPw2} placeholder="••••••••" type="password" icon="target" className="mt-2 mb-2" />
          </>
        )}
        {!reg && (
          <div className="mb-4 text-right">
            <span onClick={() => setForgot(true)} className="cursor-pointer text-[12.5px] font-semibold text-lms-accent">Quên mật khẩu?</span>
          </div>
        )}

        {err && (
          <div className="mb-2.5 text-center text-[12.5px] text-lms-danger">{err}</div>
        )}
        {needsVerify && !resent && (
          <button
            onClick={resend}
            disabled={busy}
            className="mb-2.5 w-full cursor-pointer rounded-[9px] border border-lms-line bg-transparent py-2 text-center text-[12.5px] font-semibold text-lms-accent disabled:opacity-60"
          >
            Gửi lại email xác thực
          </button>
        )}
        {resent && (
          <div className="mb-2.5 text-center text-[12.5px] text-lms-sub">
            Đã gửi lại email xác thực tới {email}.
            {resent.devVerifyLink && (
              <>
                {' '}
                <a href={resent.devVerifyLink} className="font-semibold text-lms-accent underline">
                  Xác thực ngay (dev)
                </a>
              </>
            )}
          </div>
        )}
        <Btn p={p} full size="lg" icon={reg ? 'check' : 'logout'} onClick={submit} className={reg ? 'mt-2' : ''}>
          {busy ? 'Đang xử lý…' : reg ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Btn>

        {GOOGLE_ENABLED && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-lms-line" />
              <span className="text-[11.5px] font-medium text-lms-faint">hoặc</span>
              <div className="h-px flex-1 bg-lms-line" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(cr) => cr.credential && handleGoogle(cr.credential)}
                onError={() => setErr('Đăng nhập Google thất bại')}
              />
            </div>
          </>
        )}

        <p className="m-0 mt-[18px] text-center text-[13px] text-lms-sub">
          {reg ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <span onClick={() => setTab(reg ? 'login' : 'register')} className="cursor-pointer font-bold text-lms-accent">
            {reg ? 'Đăng nhập' : 'Đăng ký miễn phí'}
          </span>
        </p>
        <p className="m-0 mt-3.5 text-center text-[11px] text-lms-faint">Đăng nhập qua API · cần backend đang chạy</p>
      </div>
    </div>
  );
}
