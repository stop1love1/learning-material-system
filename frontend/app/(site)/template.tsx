// Templates remount on every navigation (unlike layouts), so the .lms-page
// fade-rise animation replays each time the reader moves between public pages.
// Pure CSS — no client boundary needed; reduced-motion is respected in globals.css.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="lms-page">{children}</div>;
}
