// fonts.ts — font-family stacks for the LMS. The named families (Baloo 2, Plus
// Jakarta Sans, Sora, Be Vietnam Pro, DM Mono) are self-hosted via next/font in
// app/layout.tsx, which exposes them as the CSS variables referenced below.

export const SYS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

export const FONTS = {
  display: `var(--font-baloo), ${SYS}`,
  heading: {
    baloo: `var(--font-baloo), ${SYS}`,
    jakarta: `var(--font-jakarta), ${SYS}`,
    sora: `var(--font-sora), ${SYS}`,
    system: SYS,
  } as Record<string, string>,
  sans: `var(--font-bvp), ${SYS}`,
  mono: `var(--font-dmmono), 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`,
};
