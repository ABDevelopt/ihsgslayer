"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalysisIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analysis/BBCA.JK");
  }, [router]);

  return (
    <div className="py-24 text-center text-slate-400 font-mono space-y-3">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <div>Membuka Bedah Saham Kuantitatif 360°...</div>
    </div>
  );
}
