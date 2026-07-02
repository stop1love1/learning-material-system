import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { InfoPage } from "@/app/screens/info";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function Page() {
  return <ScreenHost Screen={InfoPage} routeKey="page-about" ctx={{ page: "about" }} />;
}
