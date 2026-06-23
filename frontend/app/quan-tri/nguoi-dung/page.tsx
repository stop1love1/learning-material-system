import type { Metadata } from "next";
import ScreenHost from "@/app/components/ScreenHost";
import { AUsers } from "@/app/screens/admin";

export const metadata: Metadata = { title: "Người dùng & phân quyền" };

export default function Page() {
  return <ScreenHost Screen={AUsers} routeKey="a-users" />;
}
