import type { Metadata } from "next";
import { Baloo_2, Plus_Jakarta_Sans, Sora, Be_Vietnam_Pro, DM_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { LmsProviders } from "@/app/contexts/LmsProviders";
import "./globals.css";

const baloo = Baloo_2({ subsets: ["latin", "vietnamese"], variable: "--font-baloo", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bvp",
  display: "swap",
});
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dmmono", display: "swap" });

// SEO lấy từ Cài đặt (settings.seo) để admin tự chỉnh; fallback về mặc định nếu API down.
export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: { default: "Vườn Văn · Nền tảng học liệu", template: "%s · Vườn Văn" },
    description: "Hệ thống LMS — học liệu và bài tập môn Tiếng Việt Tiểu học.",
  };
  try {
    // Server-side fetch: gọi thẳng backend nội bộ (NEXT_PUBLIC_API_URL có thể là
    // "/api" tương đối — không dùng được ở server).
    const base = (process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001") + "/api";
    const res = await fetch(`${base}/settings`, { cache: "no-store" });
    if (!res.ok) return fallback;
    const seo = (await res.json())?.seo;
    if (!seo?.title) return fallback;
    return {
      title: { default: seo.title, template: `%s · ${seo.title.split("—")[0].trim() || "Vườn Văn"}` },
      description: seo.description || fallback.description,
      keywords: Array.isArray(seo.keywords) && seo.keywords.length ? seo.keywords : undefined,
      openGraph: { title: seo.title, description: seo.description, images: seo.ogImage ? [seo.ogImage] : undefined },
    };
  } catch {
    return fallback;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${baloo.variable} ${jakarta.variable} ${sora.variable} ${beVietnam.variable} ${dmMono.variable}`}
    >
      <body>
        <AntdRegistry>
          <LmsProviders>{children}</LmsProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
