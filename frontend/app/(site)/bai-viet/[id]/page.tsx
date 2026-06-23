import ScreenHost from "@/app/components/ScreenHost";
import { SArticle } from "@/app/screens/blog";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScreenHost Screen={SArticle} routeKey="article" ctx={{ article: id }} />;
}
