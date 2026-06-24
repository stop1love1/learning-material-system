import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { SettingsScreen } from "@/app/screens/misc";

export const metadata: Metadata = { title: "Hồ sơ cá nhân" };

export default function Page() {
  return <ScreenHost Screen={SettingsScreen} routeKey="account" />;
}
