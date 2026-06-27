import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const metadata: Metadata = { title: "Xác thực email — Vườn Văn" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
