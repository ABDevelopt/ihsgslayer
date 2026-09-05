"use client";

import { HelpCircle, BookOpen, CheckCircle2, ShieldCheck, Zap, Rocket, Sunrise, Sunset, Scale } from "lucide-react";

export default function GuidePage() {
  const terms = [
    {
      title: "AI Score (0 - 100)",
      badge: "Nilai Rapor Saham",
      color: "text-emerald-400 border-emerald-500/30",
      desc: "Gabungan 5 aspek utama perusahaan (Profit, Valuasi Murah, Bebas Hutang, Likuiditas, dan Tren Harga). Nilai di atas 65 berarti perusahaan ini tergolong sangat sehat dan layak dipertimbangkan.",
    },
    {
      title: "Danger Zone (Zona Bahaya)",
      badge: "Peringatan Risiko",
      color: "text-rose-400 border-rose-500/30",
      desc: "Tanda bahaya merah untuk perusahaan yang memiliki hutang menumpuk membahayakan (DER > 5x), terus-menerus rugi, atau sahamnya sangat sepi. Sangat disarankan untuk TIDAK dibeli.",
    },
    {
      title: "Pre-ARA Hunter ",
      badge: "Calon Top Gainer",
      color: "text-rose-300 border-rose-500/30",
      desc: "Formula deteksi dini saham yang baru saja memulai letupan awal (+1.5% s/d +7.5%) dengan akselerasi Volume Velocity >= 1.5x dan dominasi buyer tanpa ekor bawah, untuk menangkap momentum sebelum terkunci di batas ARA harian.",
    },
    {
      title: "BPJS (Beli Pagi Jual Sore)",
      badge: "Intraday Fast (Win Rate 90%)",
      color: "text-emerald-300 border-emerald-500/30",
      desc: "Strategi Day-Trading membeli saham dengan lonjakan volume pagi dan dorongan buyer kuat (09:15 - 09:45 WIB) untuk dijual langsung di sesi sore (15:00 - 15:45 WIB) tanpa menginapkan risiko semalaman (Zero Overnight Risk).",
    },
    {
      title: "BSJP (Beli Sore Jual Pagi)",
      badge: "Overnight Swing",
      color: "text-amber-300 border-amber-500/30",
      desc: "Strategi membeli saham yang meledak volumenya menjelang bursa tutup (15:50 WIB) untuk dijual langsung saat harga melompat naik di pembukaan pagi esoknya (09:00 - 09:15 WIB).",
    },
    {
      title: "Hidden Accumulation",
      badge: "Jejak Bandar",
      color: "text-cyan-300 border-cyan-500/30",
      desc: "Kondisi di mana harga saham terlihat tenang/mendatar, tetapi di balik layar ada investor besar/bandar yang terus menampung saham dalam jumlah masif sebelum harga melesat naik.",
    },
    {
      title: "Graham Fair Value & Margin of Safety",
      badge: "Nilai Wajar Asli",
      color: "text-cyan-400 border-cyan-500/30",
      desc: "Rumus legendaris Benjamin Graham untuk menghitung harga wajar asli sebuah saham. Selisih diskon harga pasar terhadap nilai ini adalah 'diskon pengaman' investasi Anda.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-cardBg border border-indigo-500/40 flex items-center space-x-3 shadow-xl">
        <HelpCircle className="w-8 h-8 text-indigo-400" />
        <div>
          <h3 className="font-bold text-xl text-slate-100">
            Buku Panduan & Kamus Istilah Pemula
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Panduan praktis memahami seluruh fitur, sinyal, dan terminologi kuantitatif di IHSG Slayer.
          </p>
        </div>
      </div>

      {/* 4 Steps Guide */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
        <h4 className="font-bold text-base text-slate-200">
           4 Langkah Praktis Menggunakan Platform:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="text-emerald-400 font-mono font-bold">1. Cek Sinyal BUY / Pre-ARA</div>
            <p className="text-slate-400">
              Buka menu <strong>Sinyal BUY</strong> untuk swing atau <strong>Pre-ARA Hunter</strong> di sesi pagi untuk berburu calon Top Gainer.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-mono font-bold">2. Baca Analisis Mengapa BUY</div>
            <p className="text-slate-400">
              Setiap kartu saham menyajikan 4 poin alasan kuantitatif mengapa saham tersebut layak beli.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="text-indigo-400 font-mono font-bold">3. Pasang Matriks TP & SL</div>
            <p className="text-slate-400">
              Gunakan area <strong>Beli (Entry)</strong>, pasang target profit <strong>TP1 & TP2</strong>, dan selalu patuhi batas <strong>Cut Loss</strong>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-mono font-bold">4. Catat ke Jurnal Portofolio</div>
            <p className="text-slate-400">
              Klik tombol <strong>Catat Beli</strong> agar transaksi otomatis masuk ke <strong>Trading Journal</strong> untuk memantau kurva NAV.
            </p>
          </div>
        </div>
      </div>

      {/* Glossary Grid */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
        <h4 className="font-bold text-base text-slate-200">
          📖 Kamus Istilah Kuantitatif (Bahasa Manusia Sederhana):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {terms.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 font-mono text-sm">{t.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${t.color}`}>
                  {t.badge}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
