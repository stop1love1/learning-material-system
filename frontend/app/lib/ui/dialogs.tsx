'use client';
import React from 'react';
import { Input } from 'antd';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';

// Antd's message/modal/notification need React context (theme, locale). We grab the
// contextual instances once (via <AntdAppBridge> under ConfigProvider+App) and expose
// them here so imperative, non-hook code (async handlers) can open themed dialogs
// instead of the browser's window.prompt/alert/confirm.
interface DialogApi {
  message: MessageInstance;
  modal: ModalHookAPI;
  notification: NotificationInstance;
}

let api: DialogApi | null = null;
export function setDialogApi(a: DialogApi | null): void {
  api = a;
}

export function toastSuccess(content: string): void {
  api?.message.success(content);
}
export function toastError(content: string): void {
  api?.message.error(content);
}
export function toastInfo(content: string): void {
  api?.message.info(content);
}

export function notifySuccess(message: string, description?: string): void {
  api?.notification.success({ message, description, placement: 'topRight' });
}
export function notifyError(message: string, description?: string): void {
  api?.notification.error({ message, description, placement: 'topRight' });
}

/** Themed replacement for window.confirm — resolves true on OK, false otherwise. */
export function confirmDialog(opts: {
  title: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  const { title, content, okText = 'Đồng ý', cancelText = 'Huỷ', danger = false } = opts;
  return new Promise((resolve) => {
    if (!api) {
      resolve(false);
      return;
    }
    api.modal.confirm({
      title,
      content,
      okText,
      cancelText,
      okButtonProps: danger ? { danger: true } : undefined,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

function PromptBody({
  label,
  defaultValue,
  placeholder,
  store,
}: {
  label?: string;
  defaultValue: string;
  placeholder?: string;
  store: { value: string };
}) {
  const [v, setV] = React.useState(defaultValue);
  React.useEffect(() => {
    store.value = v;
  }, [v, store]);
  return (
    <div>
      {label && <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.85 }}>{label}</div>}
      <Input
        autoFocus
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
      />
    </div>
  );
}

/** Themed replacement for window.prompt — resolves the trimmed string, or null if cancelled. */
export function promptDialog(opts: {
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  okText?: string;
  required?: boolean;
  validate?: (value: string) => string | null;
}): Promise<string | null> {
  const {
    title,
    label,
    defaultValue = '',
    placeholder,
    okText = 'Lưu',
    required = true,
    validate,
  } = opts;
  return new Promise((resolve) => {
    if (!api) {
      resolve(null);
      return;
    }
    const store = { value: defaultValue };
    let settled = false;
    const done = (v: string | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    api.modal.confirm({
      title,
      icon: null,
      okText,
      cancelText: 'Huỷ',
      content: <PromptBody label={label} defaultValue={defaultValue} placeholder={placeholder} store={store} />,
      onOk: () => {
        const v = store.value.trim();
        if (required && !v) {
          api!.message.error('Vui lòng nhập thông tin.');
          return Promise.reject();
        }
        if (validate) {
          const err = validate(v);
          if (err) {
            api!.message.error(err);
            return Promise.reject();
          }
        }
        done(v);
      },
      onCancel: () => done(null),
    });
  });
}
