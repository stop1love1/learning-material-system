import ScreenHost from "@/app/components/ScreenHost";
import { SDocReader } from "@/app/screens/student";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreenHost Screen={SDocReader} routeKey="s-doc" ctx={{ doc: id }} />;
}
