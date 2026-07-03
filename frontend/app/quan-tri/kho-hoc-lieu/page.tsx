import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { TDocs } from "@/app/screens/resources";

export const metadata: Metadata = { title: "Kho học liệu" };

export default function Page() {
  return <ScreenHost Screen={TDocs} routeKey="docs" />;
}
