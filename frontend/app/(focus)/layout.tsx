'use client';
// (focus) route group — immersive, chrome-free layout for "doing an assignment".
import { useLmsTheme } from "@/app/contexts/ThemeProvider";

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  const { p } = useLmsTheme();
  return (
    <div className="lms-scroll" style={{ width: "100%", height: "100dvh", overflowY: "auto", background: p.bg }}>
      {children}
    </div>
  );
}
