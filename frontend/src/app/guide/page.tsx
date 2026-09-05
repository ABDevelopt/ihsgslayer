"use client";

import { useState } from "react";
import {
  HelpCircle, BookOpen, ChevronDown, ChevronRight,
  TrendingUp, BarChart3, DollarSign, Zap, Users, Shield,
  Activity, Target, Layers
} from "lucide-react";

// ============================================================
// KAMUS LENGKAP ISTILAH SAHAM
// ============================================================
const CATEGORIES = [
  {
    id: "dasar",
    icon: <BookOpen className="w-4 h-4" />,
    label: "📚 Dasar-Dasar Saham",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    terms: [
      {
        term: "Saham (Emiten)",
        badge: "Surat Kepemilikan",
        desc: "Bukti kepemilikan sebagian kecil dari sebuah perusahaan. Saat membeli 1 lot saham BBCA, kamu resmi menjadi pemilik sebagian (sangat kecil) dari Bank BCA.",
        example: "Beli 1 lot (100 lembar) BBCA seharga Rp 9.000/lembar = investasi Rp 900.000",
      },
      {
        term: "Lot",
        badge: "Satuan Perdagangan",
        desc: "Satuan pembelian saham di BEI. 1 lot = 100 lembar saham. Kamu TIDAK bisa membeli 50 atau 200 lembar — harus kelipatan 100 (1 lot, 2 lot, dst).",
        example: "Harga Rp 200/lembar → 1 lot = 100 × Rp 200 = Rp 20.000",
      },
      {
        term: "IHSG",
        badge: "Indeks Bursa Indonesia",
        desc: "Indeks Harga Saham Gabungan. Angka gabungan yang mencerminkan pergerakan rata-rata seluruh saham di Bursa Efek Indonesia. Kalau IHSG naik, secara umum pasar sedang bullish. Kalau turun, pasar sedang bearish.",
        example: "IHSG 7.000 → IHSG 7.350 = naik 5%, artinya saham-saham Indonesia rata-rata naik 5%",
      },
      {
        term: "BEI (Bursa Efek Indonesia)",
        badge: "Pasar Modal",
        desc: "Tempat resmi jual-beli saham perusahaan di Indonesia. Jam buka: Senin-Jumat, sesi 1 pukul 09:00-12:00 WIB dan sesi 2 pukul 13:30-15:50 WIB. Hari libur bursa tidak ada perdagangan.",
        example: "BEI mirip seperti pasar tradisional, tapi yang diperjualbelikan adalah surat kepemilikan perusahaan",
      },
      {
        term: "Market Cap (Kapitalisasi Pasar)",
        badge: "Ukuran Perusahaan",
        desc: "Total nilai pasar sebuah perusahaan = harga saham × jumlah lembar beredar. Semakin besar market cap, semakin 'berat' dan stabil sahamnya. Small cap (< Rp 1 T) lebih liar, large cap (> Rp 10 T) lebih stabil.",
        example: "Harga BBCA Rp 9.000 × 24,6 miliar lembar = Market Cap ±Rp 221 Triliun (Large Cap)",
      },
      {
        term: "ARA / ARB",
        badge: "Batas Naik/Turun Harian",
        desc: "Auto Rejection Above (ARA) = batas naik harian otomatis (saham dikunci agar tidak naik melebihi batas, biasanya +25% atau +35%). ARB = Auto Rejection Below, batas turun (-7%). BEI memasang sistem ini untuk mencegah manipulasi ekstrem.",
        example: "Saham 'gorengan' sering terkena ARA beberapa hari berturut-turut lalu tiba-tiba ARB",
      },
    ],
  },
  {
    id: "fundamental",
    icon: <DollarSign className="w-4 h-4" />,
    label: "💰 Analisis Fundamental",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    terms: [
      {
        term: "PER (Price to Earnings Ratio)",
        badge: "Valuasi Murah/Mahal",
        desc: "Perbandingan harga saham dengan laba per lembarnya. Semakin rendah PER, semakin murah valuasi saham tersebut dibandingkan labanya. PER < 10x dianggap murah; > 25x dianggap mahal.",
        example: "PER = 8x artinya: jika labanya tetap, kamu baru balik modal setelah 8 tahun",
      },
      {
        term: "PBV (Price to Book Value)",
        badge: "Harga vs Nilai Buku",
        desc: "Perbandingan harga saham dengan nilai aset bersih (kekayaan) per lembarnya. PBV < 1x artinya kamu membeli aset perusahaan dengan harga DISKON — ibarat beli rumah seharga di bawah nilai tanah + bangunannya.",
        example: "PBV = 0.7x → beli aset Rp 100 juta hanya dengan Rp 70 juta. Murah!",
      },
      {
        term: "ROE (Return on Equity)",
        badge: "Tingkat Keuntungan",
        desc: "Seberapa efisien perusahaan menghasilkan laba dari modal sendiri. ROE = Laba Bersih ÷ Modal Sendiri. ROE > 15% biasanya tanda perusahaan sehat dan kompetitif. Semakin tinggi, semakin bagus.",
        example: "ROE 20% = setiap Rp 100 modal sendiri menghasilkan Rp 20 laba bersih per tahun",
      },
      {
        term: "DER (Debt to Equity Ratio)",
        badge: "Rasio Hutang",
        desc: "Perbandingan hutang perusahaan dengan modal sendiri. DER tinggi = perusahaan banyak berhutang = risiko tinggi. DER > 3x mulai berbahaya, DER > 5x masuk Danger Zone. Idealnya DER < 1x.",
        example: "DER = 2x: perusahaan punya hutang 2 kali lipat dari modal sendiri",
      },
      {
        term: "EPS (Earning Per Share)",
        badge: "Laba per Lembar",
        desc: "Laba bersih perusahaan dibagi jumlah lembar saham yang beredar. EPS ini yang 'dijual' kepada investor. EPS yang terus naik setiap kuartal adalah tanda perusahaan bertumbuh sehat.",
        example: "EPS Rp 500 → harga saham Rp 5.000 → PER = 5.000 ÷ 500 = 10x",
      },
      {
        term: "Graham Number & Margin of Safety",
        badge: "Nilai Wajar + Diskon",
        desc: "Rumus Benjamin Graham (investor legendaris) untuk menghitung harga WAJAR sebuah saham dari data fundamental: √(22.5 × EPS × Book Value per Share). Margin of Safety = seberapa jauh harga pasar masih di bawah nilai wajar tersebut — makin besar diskonnya, makin aman.",
        example: "Graham Value Rp 1.200, harga pasar Rp 900 → Margin of Safety = 25% (murah!)",
      },
      {
        term: "Current Ratio",
        badge: "Kemampuan Bayar Hutang",
        desc: "Perbandingan aset lancar (kas, piutang, persediaan) dengan hutang jangka pendek. Current Ratio > 1.5x artinya perusahaan mampu membayar semua tagihan jangka pendeknya dengan nyaman.",
        example: "Current Ratio = 2x: punya Rp 2 aset lancar untuk setiap Rp 1 hutang jangka pendek",
      },
    ],
  },
  {
    id: "teknikal",
    icon: <TrendingUp className="w-4 h-4" />,
    label: "📈 Analisis Teknikal",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    terms: [
      {
        term: "Support (Lantai Harga)",
        badge: "Batas Bawah Kuat",
        desc: "Level harga di mana ada banyak pembeli siap menampung saham sehingga harga cenderung memantul naik. Ibarat 'lantai' — harga susah menembus ke bawah level ini. Jika ditembus, level support lama menjadi resistance baru.",
        example: "Support di Rp 1.000: harga sudah 3 kali menyentuh Rp 1.000 lalu naik → level support kuat",
      },
      {
        term: "Resistance (Atap Harga)",
        badge: "Batas Atas Kuat",
        desc: "Level harga di mana banyak penjual melepas saham sehingga harga cenderung mentok/terhalang. Ibarat 'langit-langit' atau 'tembok'. Jika berhasil ditembus, resistance lama menjadi support baru (breakout).",
        example: "Resistance di Rp 1.500: harga sudah 3 kali menyentuh Rp 1.500 lalu turun",
      },
      {
        term: "MA20 / MA50 / MA200",
        badge: "Moving Average",
        desc: "Rata-rata harga penutupan dalam 20, 50, atau 200 hari terakhir. MA digunakan untuk melihat arah tren. Harga di atas MA50 = uptrend (bullish). Harga di bawah MA50 = downtrend (bearish). MA200 adalah tren jangka sangat panjang.",
        example: "Harga Rp 1.200, MA50 Rp 1.100 → harga di atas MA50 = tren naik (bullish)",
      },
      {
        term: "RSI (Relative Strength Index)",
        badge: "Kekuatan Momentum 0 - 100",
        desc: "Indikator teknikal osilator 0–100 untuk mengukur kecepatan dan perubahan harga saham. Digunakan oleh trader dunia untuk mendeteksi dua kondisi ekstrem: titik jenuh beli (Overbought) dan titik jenuh jual (Oversold). Nilai 50 adalah titik ekuilibrium netral.",
        example: "RSI 25 = sinyal oversold (potensi rebound). RSI 78 = sinyal overbought (rawan koreksi turun).",
      },
      {
        term: "Overbought (Jenuh Beli — RSI > 70)",
        badge: "Zona Kepanasan / Rawan Koreksi",
        desc: "Kondisi saat harga saham sudah naik terlalu tinggi dan terlalu cepat dalam waktu singkat akibat aksi beli membabi-buta (FOMO). Di zona ini, tenaga pembeli mulai habis dan pembeli awal bersiap merealisasikan keuntungan (take profit).\n\n💡 ANALOGI: Seperti pelari sprint 100 meter yang kehabisan napas dan harus berhenti sejenak untuk istirahat/menarik napas.\n\n🎯 REKOMENDASI AKSI:\n• JANGAN beli baru / kejar harga di pucuk (risiko nyangkut sangat tinggi).\n• Amankan keuntungan bertahap (Take Profit 30%–50% lot).\n• Naikkan batas Trailing Stop ketat untuk mengunci profit yang sudah berjalan.",
        example: "Saham melesat 5 hari berturut-turut hingga RSI menyentuh 78 → hari berikutnya rawan aksi profit taking",
      },
      {
        term: "Oversold / Oversell (Jenuh Jual — RSI < 30)",
        badge: "Zona Obral Murah / Potensi Rebound",
        desc: "Kondisi saat harga saham sudah anjlok terlalu dalam dan dibanting terus-menerus karena kepanikan pasar (panic selling). Di zona ini, tekanan penjual sudah mengering (dry-up) dan valuasi saham dianggap diskon besar oleh institusi/smart money.\n\n💡 ANALOGI: Seperti bola karet yang dilempar kencang ke lantai semen — begitu menghantam titik terendah, bola pasti akan memantul naik (technical rebound).\n\n🎯 REKOMENDASI AKSI:\n• JANGAN ikut-ikutan panik cut loss di titik nadir saat RSI sudah < 25–30.\n• Pasang radar watchlist dan tunggu candle konfirmasi pembalikan (Hammer / Doji / Golden Cross).\n• Lakukan cicil beli bertahap (Buy on Weakness) dengan batasan risiko terukur di support.",
        example: "Saham tertekan berita panik hingga RSI 22 di area support kuat → esoknya memantul rebound +6%",
      },
      {
        term: "MACD",
        badge: "Sinyal Tren & Momentum",
        desc: "Moving Average Convergence Divergence. Indikator yang mendeteksi perubahan arah tren. MACD Line memotong Signal Line ke atas = sinyal BUY (Golden Cross). MACD memotong ke bawah = sinyal SELL (Death Cross).",
        example: "MACD line melewati signal line dari bawah ke atas = golden cross, sinyal bullish",
      },
      {
        term: "Bollinger Band",
        badge: "Terowongan Volatilitas",
        desc: "Tiga garis yang membentuk 'terowongan' berdasarkan volatilitas: Upper Band (atas), Middle Band (MA20), Lower Band (bawah). Ketika harga menyentuh Lower Band = potensi beli. Ketika harga menyentuh Upper Band = potensi jual. Terowongan menyempit = akan terjadi pergerakan besar (Squeeze).",
        example: "Harga menyentuh Lower Band + RSI < 30 = sinyal beli yang sangat kuat",
      },
      {
        term: "Pivot Point",
        badge: "Titik Tengah Referensi",
        desc: "Titik harga tengah yang dihitung dari high, low, close hari sebelumnya. Digunakan trader harian untuk menentukan arah bias. Di atas Pivot = bias bullish, di bawah Pivot = bias bearish. Pivot juga menghasilkan level Support dan Resistance otomatis (S1, S2, R1, R2).",
        example: "Pivot = (High + Low + Close) ÷ 3 dari perdagangan kemarin",
      },
      {
        term: "ATR (Average True Range)",
        badge: "Ukuran Volatilitas",
        desc: "Mengukur berapa rata-rata rentang pergerakan harga per hari. ATR tinggi = saham volatile (bergerak liar). ATR rendah = saham tenang. ATR digunakan untuk menetapkan Stop Loss yang proporsional, bukan sembarangan.",
        example: "ATR = Rp 50 → Stop Loss ideal di 1.5× ATR = Rp 75 di bawah harga beli",
      },
      {
        term: "Volume",
        badge: "Besarnya Transaksi",
        desc: "Jumlah lembar saham yang diperdagangkan dalam satu hari. Volume besar + harga naik = sinyal KUAT (ada pembeli besar masuk). Volume besar + harga turun = tekanan jual signifikan. Volume kecil saat harga naik = gerakan lemah, tidak bisa dipercaya.",
        example: "Volume rata-rata 1 juta lot/hari, tiba-tiba 10 juta lot = ada aksi besar sedang terjadi",
      },
    ],
  },
  {
    id: "bandarmologi",
    icon: <Users className="w-4 h-4" />,
    label: "🕵️ Bandarmologi & Aliran Dana",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    terms: [
      {
        term: "Bandar",
        badge: "Pelaku Pasar Dominan",
        desc: "Investor institusi besar (reksa dana, sekuritas asing, manajer investasi) yang menguasai pergerakan saham tertentu lewat transaksi berskala besar. Mereka beli dulu dalam jumlah besar (akumulasi), lalu harga naik, lalu mereka jual (distribusi) ke retail.",
        example: "Bandar beli 10 juta lot dalam 2 minggu secara tersembunyi → harga mendatar → lalu tiba-tiba meledak",
      },
      {
        term: "CR3 (Concentration Ratio 3 Broker)",
        badge: "Konsentrasi 3 Broker Teratas",
        desc: "Persentase total transaksi yang dikuasai oleh 3 broker terbesar di saham itu. CR3 > 55% = transaksi sangat terkonsentrasi di tangan segelintir pemain besar (tanda bandar aktif). CR3 < 40% = pasar terdistribusi merata (lebih aman dari manipulasi).",
        example: "CR3 = 70%: dari 10 miliar transaksi, 7 miliar dilakukan hanya oleh 3 broker saja",
      },
      {
        term: "Bandar VWAP",
        badge: "Harga Modal Bandar",
        desc: "Estimasi harga rata-rata tertimbang volume (Volume Weighted Average Price) di mana bandar mengakumulasi sahamnya. Jika harga pasar masih di bawah atau dekat Bandar VWAP, artinya kamu masuk di harga yang sama dengan bandar — sangat menguntungkan.",
        example: "Bandar VWAP Rp 1.050, harga sekarang Rp 1.020 → masuk sebelum bandar markup = ideal",
      },
      {
        term: "Akumulasi vs Distribusi",
        badge: "Fase Bandar",
        desc: "Akumulasi = fase bandar mengumpulkan saham pelan-pelan (harga mendatar/turun sedikit, volume tersembunyi). Distribusi = fase bandar melepas saham ke retail (harga naik cepat, volume meledak). Kunci untung: masuk di fase akumulasi, keluar saat distribusi.",
        example: "Harga sideways 3 bulan (akumulasi) → tiba-tiba naik 50% dalam 2 minggu (distribusi ke retail)",
      },
      {
        term: "Net Foreign (Asing Beli/Jual)",
        badge: "Aliran Dana Asing",
        desc: "Selisih antara total pembelian dan penjualan investor asing. Net Foreign Buy = asing lebih banyak beli (bullish signal). Net Foreign Sell = asing lebih banyak jual (pressure jual). Investor asing memiliki riset mendalam — pergerakan mereka sering jadi leading indicator.",
        example: "Net Foreign Buy Rp 500 miliar dalam sepekan → sinyal bullish kuat untuk saham tersebut",
      },
    ],
  },
  {
    id: "strategi",
    icon: <Target className="w-4 h-4" />,
    label: "🎯 Strategi Trading",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    terms: [
      {
        term: "Cut Loss",
        badge: "WAJIB: Batas Rugi Maksimal",
        desc: "Menjual saham dengan kerugian kecil SEBELUM kerugian menjadi besar. Ini adalah disiplin paling penting dalam trading. Tanpa cut loss, kerugian kecil (-5%) bisa menjadi bencana besar (-50%). IHSG Slayer merekomendasikan cut loss di -3% s/d -5%.",
        example: "Beli di Rp 1.000 → pasang cut loss Rp 970 → jika turun ke Rp 970 langsung jual, tidak ditahan",
      },
      {
        term: "Take Profit (TP1 & TP2)",
        badge: "Target Realisasi Keuntungan",
        desc: "Level harga target di mana kamu akan menjual saham untuk mengambil keuntungan. TP1 = target pertama (lebih mudah dicapai, jual sebagian). TP2 = target kedua (lebih optimis, tahan sisanya). Jangan serakah — ambil profit saat target tercapai.",
        example: "Beli Rp 1.000 → TP1 di Rp 1.050 (+5%), jual 50% posisi → TP2 di Rp 1.100 (+10%), jual sisa",
      },
      {
        term: "Entry Zone",
        badge: "Area Masuk Ideal",
        desc: "Rentang harga terbaik untuk membeli suatu saham berdasarkan analisis teknikal dan fundamental. Beli di entry zone = risiko paling kecil, potensi profit paling besar. Beli terlalu tinggi dari entry zone = risiko bertambah besar.",
        example: "Entry Zone Rp 980-1.020 → beli di kisaran ini, bukan di Rp 1.100 (sudah terlambat)",
      },
      {
        term: "DCA (Dollar Cost Averaging)",
        badge: "Cicil Berkala",
        desc: "Strategi membeli saham secara rutin dan berkala (contoh: tiap bulan), tidak peduli harganya naik atau turun. Tujuannya meratakan harga beli (average down) agar tidak terjebak membeli di harga puncak. Cocok untuk investasi jangka panjang.",
        example: "Beli 1 lot BBCA setiap tanggal 1 selama 12 bulan, apapun kondisi pasar",
      },
      {
        term: "Swing Trading",
        badge: "Trading 1-4 Minggu",
        desc: "Strategi menahan saham selama beberapa hari hingga beberapa minggu untuk menangkap pergerakan harga ('ayunan'). Berbeda dengan scalping (menit-jam) atau investasi (tahun). Swing trader mencari saham yang akan 'terayun' naik setelah menyentuh support.",
        example: "Beli Senin di support, target jual Jumat minggu depan setelah harga naik ke resistance",
      },
      {
        term: "Scalping / Intraday",
        badge: "Trading Dalam Hari",
        desc: "Strategi beli dan jual di hari yang sama, memanfaatkan pergerakan harga kecil dalam hitungan menit hingga jam. Risiko tinggi, butuh disiplin ketat dan pemantauan aktif. Tidak menginap (no overnight risk), tapi butuh waktu dan konsentrasi penuh.",
        example: "Beli jam 09:20 WIB, jual jam 14:30 WIB setelah naik 2-3%, selesai dalam satu hari",
      },
      {
        term: "Trailing Stop",
        badge: "Stop Loss Bergerak",
        desc: "Batas stop loss yang terus bergerak naik mengikuti harga saat saham naik, tapi tidak bergerak saat harga turun. Fungsinya: melindungi profit yang sudah didapat. Saat harga berbalik turun melewati trailing stop, otomatis jual.",
        example: "Trailing stop 5%: harga naik dari 1.000 ke 1.200 → trailing stop naik ke 1.140 (1.200 × 95%)",
      },
    ],
  },
  {
    id: "sinyal",
    icon: <Zap className="w-4 h-4" />,
    label: "⚡ Sinyal & Istilah Platform",
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    terms: [
      {
        term: "AI Score (0–100)",
        badge: "Rapor Saham",
        desc: "Nilai gabungan dari 5 pilar penilaian: Profitabilitas, Valuasi, Solvabilitas, Likuiditas, dan Momentum Tren. Skor 70+ = sangat layak beli. Skor 50-70 = cukup baik. Skor < 50 = perlu hati-hati. Skor ini bukan prediksi harga — ini rapor kesehatan saham.",
        example: "AI Score 82 = perusahaan sangat sehat dari 5 dimensi penilaian kuantitatif",
      },
      {
        term: "Danger Zone / Stock Shield",
        badge: "Filter Keamanan",
        desc: "Sistem proteksi yang memblokir saham berisiko tinggi: hutang ekstrem (DER > 5x), rugi terus-menerus, volume abnormal (tanda pump & dump), atau saham yang mudah dimanipulasi. Jika saham masuk Danger Zone, sistem mengeluarkan peringatan keras.",
        example: "DER = 8x + rugi 3 kuartal berturut-turut = Danger Zone, jangan dibeli",
      },
      {
        term: "Pre-ARA Hunter",
        badge: "Deteksi Dini ARA",
        desc: "Sistem yang mendeteksi saham yang sudah mulai 'panas' (naik +1.5% s/d +7.5%) dengan volume meledak di pagi hari, SEBELUM harga mencapai ARA dan terkunci. Tujuannya masuk sebelum harga dikunci di batas maksimal harian.",
        example: "Saham naik 4% jam 09:30, volume 5x dari biasanya → Pre-ARA signal → beli, harapan kena ARA",
      },
      {
        term: "Minervini Stage 2",
        badge: "Fase Ideal Beli",
        desc: "Konsep Mark Minervini: siklus harga saham dibagi 4 tahap. Stage 1 (akumulasi), Stage 2 (uptrend), Stage 3 (distribusi), Stage 4 (downtrend). Beli HANYA di Stage 2: harga di atas MA50 dan MA200, MA50 di atas MA200, volume mengonfirmasi kenaikan.",
        example: "Harga > MA50 > MA150 > MA200, semua MA bergerak naik = sempurna Stage 2",
      },
      {
        term: "VCP (Volatility Contraction Pattern)",
        badge: "Penyusutan Menuju Ledakan",
        desc: "Pola yang ditemukan oleh Mark Minervini: volatilitas saham menyusut secara bertahap (koreksi makin kecil, volume makin kering) sebelum terjadi breakout besar. Penyusutan ini menandakan supply penjual sudah habis — siap meledak.",
        example: "Koreksi 15% → 8% → 4% → volume kering → BREAKOUT — ini pola VCP klasik",
      },
      {
        term: "Confluence (Konfluensi)",
        badge: "Kesesuaian Multi-Metode",
        desc: "Ketika beberapa metode analisis yang berbeda memberikan sinyal yang sama secara bersamaan. Makin banyak metode yang setuju (fundamental + teknikal + bandarmologi semua bullish), makin tinggi probabilitas keberhasilan trade.",
        example: "RSI oversold + di support kuat + bandar akumulasi + fundamental bagus = konfluensi 4 faktor",
      },
      {
        term: "Golden Entry",
        badge: "Harga di Bawah Bandar VWAP",
        desc: "Kondisi di mana harga saham saat ini masih berada di bawah atau sama dengan estimasi harga rata-rata akumulasi bandar. Artinya kamu masuk dengan harga lebih murah dari bandar — posisi yang sangat menguntungkan.",
        example: "Bandar VWAP Rp 1.100, harga sekarang Rp 1.050 = Golden Entry zone",
      },
    ],
  },
];

export default function GuidePage() {
  const [openCategory, setOpenCategory] = useState<string>("dasar");
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl pg-surface border border-indigo-500/40 flex items-start gap-4 shadow-xl">
        <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 shrink-0">
          <HelpCircle className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h2 className="font-bold text-xl pg-text">
            📖 Buku Panduan & Kamus Istilah Saham
          </h2>
          <p className="text-xs pg-text-muted mt-1 leading-relaxed">
            40+ istilah dunia saham dalam bahasa Indonesia sederhana, cocok untuk pemula hingga trader berpengalaman.
            Klik kategori untuk memperluas, klik istilah untuk membaca penjelasan lengkap.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenCategory(c.id === openCategory ? "" : c.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  openCategory === c.id ? c.color : "pg-muted border pg-divider pg-text-muted hover:pg-text"
                }`}
              >
                {c.label.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Steps Quick Guide */}
      <div className="p-5 rounded-2xl pg-surface border pg-divider shadow-lg space-y-4">
        <h4 className="font-bold text-sm pg-text flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          4 Langkah Praktis Menggunakan Platform:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {[
            { num: "1", color: "text-emerald-400", title: "Cek Sinyal BUY / Pre-ARA", desc: "Buka menu Sinyal BUY untuk swing atau Pre-ARA Hunter di sesi pagi untuk berburu calon Top Gainer." },
            { num: "2", color: "text-cyan-400", title: "Baca Analisis Mengapa BUY", desc: "Setiap kartu saham menyajikan 4 poin alasan kuantitatif mengapa saham tersebut layak beli." },
            { num: "3", color: "text-indigo-400", title: "Pasang Matriks TP & SL", desc: "Gunakan area Beli (Entry), pasang target profit TP1 & TP2, dan selalu patuhi batas Cut Loss." },
            { num: "4", color: "text-amber-400", title: "Catat ke Jurnal Portofolio", desc: "Klik tombol Catat Beli agar transaksi otomatis masuk ke Trading Journal untuk memantau kurva NAV." },
          ].map((step) => (
            <div key={step.num} className="p-4 rounded-xl pg-muted border pg-divider space-y-1.5">
              <div className={`${step.color} font-mono font-bold text-xs`}>{step.num}. {step.title}</div>
              <p className="pg-text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="rounded-2xl pg-surface border pg-divider shadow-sm overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setOpenCategory(cat.id === openCategory ? "" : cat.id)}
              className="w-full p-4 flex items-center justify-between hover:pg-elevated transition-all"
            >
              <div className="flex items-center gap-3">
                <span className={`p-1.5 rounded-lg border text-sm ${cat.color}`}>
                  {cat.icon}
                </span>
                <span className="font-bold text-sm pg-text">{cat.label}</span>
                <span className="text-[10px] pg-text-faint font-mono">
                  {cat.terms.length} istilah
                </span>
              </div>
              {openCategory === cat.id
                ? <ChevronDown className="w-4 h-4 pg-text-muted" />
                : <ChevronRight className="w-4 h-4 pg-text-muted" />
              }
            </button>

            {/* Terms List */}
            {openCategory === cat.id && (
              <div className="border-t pg-divider divide-y pg-divider/50">
                {cat.terms.map((t, idx) => (
                  <div key={idx} className="group">
                    <button
                      onClick={() => setOpenTerm(openTerm === `${cat.id}-${idx}` ? null : `${cat.id}-${idx}`)}
                      className="w-full px-5 py-3 flex items-center justify-between text-left hover:pg-elevated transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-sm font-mono pg-text-2 truncate">{t.term}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border shrink-0 hidden sm:inline ${cat.color}`}>
                          {t.badge}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 pg-text-muted shrink-0 transition-transform ${
                          openTerm === `${cat.id}-${idx}` ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openTerm === `${cat.id}-${idx}` && (
                      <div className="px-5 pb-4 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                        <p className="text-xs pg-text-3 leading-relaxed font-sans">{t.desc}</p>
                        {t.example && (
                          <div className="flex items-start gap-2 pg-muted border pg-divider rounded-xl px-3 py-2.5">
                            <span className="text-base shrink-0">💡</span>
                            <p className="text-[11px] pg-text-muted font-mono leading-relaxed">{t.example}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="p-4 rounded-xl pg-muted border pg-divider text-center text-xs pg-text-faint">
        ⚠️ Seluruh konten ini bersifat edukasi. IHSG Slayer bukan konsultan keuangan berlisensi.
        Keputusan investasi sepenuhnya menjadi tanggung jawab Anda.
      </div>
    </div>
  );
}
