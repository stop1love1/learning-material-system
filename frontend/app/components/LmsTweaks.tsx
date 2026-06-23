'use client';
// LmsTweaks — the live appearance panel content, wired to the global theme
// context. Rendered once (globally) by LmsProviders so its gear FAB is available
// on every route. Extracted from the old App.tsx.
import React from 'react';
import { useLmsTheme } from '@/app/contexts/ThemeProvider';
import {
  TweaksPanel,
  TweakSection,
  TweakSelect,
  TweakToggle,
  TweakRadio,
  TweakButton,
} from '@/app/components/TweaksPanel';

const ACCENT_SWATCH: Record<string, string> = {
  grass: '#3f9d5c',
  sky: '#2f7fe0',
  coral: '#ec6238',
  amber: '#d98a12',
  grape: '#8a52d6',
};

export function LmsTweaks() {
  const { t, setTweak, resetTheme } = useLmsTheme();
  return (
    <TweaksPanel>
      <TweakSection label="Màu & Typography" />
      <div style={{ padding: '2px 2px 10px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Màu nhấn</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(ACCENT_SWATCH).map(([k, hex]) => (
            <button
              key={k}
              onClick={() => setTweak('accent', k)}
              title={k}
              style={{
                width: 30,
                height: 30,
                borderRadius: 12,
                cursor: 'pointer',
                background: hex,
                border: t.accent === k ? `2px solid #111` : '2px solid transparent',
                outline: t.accent === k ? '2px solid #fff' : 'none',
                outlineOffset: -4,
              }}
            />
          ))}
        </div>
      </div>
      <TweakSelect
        label="Font tiêu đề"
        value={t.headingFont}
        options={[
          { value: 'baloo', label: 'Baloo 2 (bo tròn, thân thiện)' },
          { value: 'jakarta', label: 'Plus Jakarta Sans' },
          { value: 'sora', label: 'Sora' },
          { value: 'system', label: 'Hệ thống' },
        ]}
        onChange={(v: string) => setTweak('headingFont', v)}
      />
      <TweakToggle label="Chế độ tối" value={t.dark} onChange={(v: boolean) => setTweak('dark', v)} />

      <TweakSection label="Bố cục" />
      <TweakRadio label="Mật độ" value={t.density} options={['compact', 'regular']} onChange={(v: string) => setTweak('density', v)} />
      <TweakToggle label="Thanh bên rộng (Quản trị)" value={t.railWide} onChange={(v: boolean) => setTweak('railWide', v)} />

      <TweakSection label="Luồng giao bài" />
      <TweakRadio
        label="Kiểu giao bài"
        value={t.assignFlow}
        options={[
          { value: 'wizard', label: 'Theo bước' },
          { value: 'single', label: 'Một trang' },
        ]}
        onChange={(v: string) => setTweak('assignFlow', v)}
      />

      <TweakSection label="Chấm điểm" />
      <TweakRadio
        label="Hiển thị rubric"
        value={t.rubricStyle}
        options={[
          { value: 'matrix', label: 'Ma trận' },
          { value: 'cards', label: 'Thẻ' },
        ]}
        onChange={(v: string) => setTweak('rubricStyle', v)}
      />

      <TweakSection label="Khôi phục" />
      <TweakButton label="Đặt lại giao diện" secondary onClick={resetTheme} />
    </TweaksPanel>
  );
}
