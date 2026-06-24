'use client';
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
      <div className="px-0.5 pb-2.5">
        <div className="mb-2 text-xs text-lms-faint">Màu nhấn</div>
        <div className="flex gap-2">
          {Object.entries(ACCENT_SWATCH).map(([k, hex]) => (
            <button
              key={k}
              onClick={() => setTweak('accent', k)}
              title={k}
              className={`h-[30px] w-[30px] cursor-pointer rounded-xl ${t.accent === k ? 'border-2 border-neutral-900 outline-2 outline-offset-[-4px] outline-white' : 'border-2 border-transparent'}`}
              style={{ background: hex }}
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
