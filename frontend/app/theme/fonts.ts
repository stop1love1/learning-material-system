// Self-hosted via next/font in app/layout.tsx → CSS variables below.

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
