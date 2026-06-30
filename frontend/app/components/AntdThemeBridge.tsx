'use client';
import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';

/**
 * Bridges the LMS theme (palette + dark/light + accent tweak) into antd's
 * ConfigProvider so every antd component (Select/Input/Pagination/Table/…)
 * matches the bespoke inline-style palette. Must sit under <ThemeProvider> (to
 * read the theme) and under <AntdRegistry> (for SSR style extraction).
 */
export function AntdThemeBridge({ children }: { children: React.ReactNode }) {
  const { p, dark } = useLmsTheme();
  // Solid base text colours (palette ink/sub are rgba w/ alpha → give antd solids
  // so its derived neutral ramp + component tokens stay crisp; rgba seeds get
  // flattened to near-white in dark mode otherwise).
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
      {children}
    </ConfigProvider>
  );
}
