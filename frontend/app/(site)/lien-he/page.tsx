import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { InfoPage } from "@/app/screens/info";

export const metadata: Metadata = { title: "Liên hệ" };

export default function Page() {
  return <ScreenHost Screen={InfoPage} routeKey="page-contact" ctx={{ page: "contact" }} />;
}
