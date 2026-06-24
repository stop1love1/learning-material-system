import { PublicChrome } from "@/app/components/PublicChrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
