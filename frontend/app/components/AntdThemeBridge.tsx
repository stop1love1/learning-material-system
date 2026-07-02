'use client';
import React from 'react';
import { App, ConfigProvider, theme as antdTheme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import { setDialogApi } from '@/app/lib/ui/dialogs';

// Publishes antd's context-aware message/modal/notification instances to the
// imperative dialog helpers, so async handlers can open themed dialogs.
function AntdApiBridge({ children }: { children: React.ReactNode }) {
  const staticApi = App.useApp();
  React.useEffect(() => {
    setDialogApi(staticApi);
    return () => setDialogApi(null);
  }, [staticApi]);
  return <>{children}</>;
}

/**
 * Maps LMS palette/dark mode into antd ConfigProvider tokens.
 * Must sit under ThemeProvider and AntdRegistry.
 */
export function AntdThemeBridge({ children }: { children: React.ReactNode }) {
  const { p, dark } = useLmsTheme();
  // Palette ink/sub are rgba — antd needs solid seeds for dark-mode neutrals.
  const textBase = dark ? '#fdfaf5' : '#241c12';
  const textSub = dark ? '#c9c0b2' : '#6b5e4e';
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: p.accent,
          colorInfo: p.accent,
          colorSuccess: p.ok,
          colorWarning: p.warn,
          colorError: p.danger,
          colorLink: p.accent,
          colorBgBase: p.bg,
          colorTextBase: textBase,
          colorBgContainer: p.surface,
          colorBgElevated: p.raise,
          colorBorder: p.line,
          colorBorderSecondary: p.lineSoft,
          borderRadius: 10,
          controlHeight: 40,
          fontFamily: 'var(--font-bvp), system-ui, sans-serif',
          fontSize: 14,
          boxShadow: p.shadow,
        },
        components: {
          Select: { optionSelectedBg: p.accentSoft, controlHeight: 40 },
          Input: { controlHeight: 40 },
          InputNumber: { controlHeight: 40 },
          DatePicker: { controlHeight: 40 },
          Pagination: { itemActiveBg: p.accentSoft },
          Segmented: { itemSelectedBg: p.surface, trackBg: p.sink, itemSelectedColor: textBase },
          Table: { headerBg: p.sink, rowHoverBg: p.accentSoft, borderColor: p.line, headerColor: textSub },
          Tag: { defaultBg: p.accentSoft },
          Button: { primaryShadow: 'none', defaultBg: p.surface, defaultBorderColor: p.line },
        },
      }}
    >
      {/* Default wrapper (.ant-app) — required for antd cssVar; children use h-dvh so
          the extra block div doesn't affect layout. It also hosts the message/modal
          /notification holders consumed by AntdApiBridge. */}
      <App className="contents">
        <AntdApiBridge>{children}</AntdApiBridge>
      </App>
    </ConfigProvider>
  );
}
