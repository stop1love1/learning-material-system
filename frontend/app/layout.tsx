import type { Metadata } from "next";
import { Baloo_2, Plus_Jakarta_Sans, Sora, Be_Vietnam_Pro, DM_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { LmsProviders } from "@/app/contexts/LmsProviders";
import "./globals.css";

// Self-hosted fonts → CSS variables referenced by app/lms/theme/fonts.ts.
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

export const metadata: Metadata = {
  title: {
    default: "Vườn Văn · Học liệu Ngữ văn Tiểu học",
    template: "%s · Vườn Văn",
  },
  description: "Hệ thống LMS — học liệu, đề thi, bài giảng và bài tập môn Ngữ văn / Tiếng Việt Tiểu học.",
};

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
          <ConfigProvider theme={{ token: { colorPrimary: "#3f9d5c", fontFamily: "var(--font-bvp)" } }}>
            <LmsProviders>{children}</LmsProviders>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
