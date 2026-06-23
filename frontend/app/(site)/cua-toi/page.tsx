import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { SLibrary } from "@/app/screens/student";

export const metadata: Metadata = { title: "Của tôi" };

export default function Page() {
  return <ScreenHost Screen={SLibrary} routeKey="s-mine" />;
}
