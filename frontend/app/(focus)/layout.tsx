'use client';
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lms-scroll lms-page-scroll h-dvh w-full overflow-y-auto bg-lms-bg">
      {children}
    </div>
  );
}
