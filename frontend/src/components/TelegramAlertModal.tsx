"use client";

import { useState, useEffect } from "react";
import { X, Bell, Send, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Eye, EyeOff, ExternalLink, Zap } from "lucide-react";

interface TelegramAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertSettingsState {
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  min_score_filter: number;
  enable_pre_ara_alerts: boolean;
  enable_bpjs_alerts: boolean;
  enable_bsjp_alerts: boolean;
  enable_confluence_alerts: boolean;
  enable_execution_alerts: boolean;
}

import { getApiBase } from "@/lib/api";
const API_BASE = getApiBase();

export default function TelegramAlertModal({ isOpen, onClose }: TelegramAlertModalProps) {
  const [settings, setSettings] = useState<AlertSettingsState>({
    telegram_enabled: true,
    telegram_bot_token: "",
    telegram_chat_id: "",
    min_score_filter: 75.0,
    enable_pre_ara_alerts: true,
    enable_bpjs_alerts: true,
    enable_bsjp_alerts: true,
    enable_confluence_alerts: true,
    enable_execution_alerts: true,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [detectingChatId, setDetectingChatId] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);

  const handleDetectChatId = async () => {
    if (!settings.telegram_bot_token) {
      setFeedback({ type: "error", message: "Masukkan Bot Token terlebih dahulu." });
      return;
    }
    setDetectingChatId(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/alerts/detect-chat-id?bot_token=${encodeURIComponent(settings.telegram_bot_token)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Gagal mendeteksi Chat ID.");
      }
      if (data.status === "SUCCESS" && data.chat_id) {
        setSettings((prev) => ({ ...prev, telegram_chat_id: data.chat_id }));
        setFeedback({
          type: "success",
          message: `[TERDETEKSI] Chat ID berhasil ditemukan: ${data.chat_id} (${data.name || "Akun Telegram"}). Jangan lupa klik 'Simpan Pengaturan'!`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Belum ada pesan masuk. Buka bot di Telegram, klik Start, lalu klik tombol ini lagi.",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Gagal menghubungi Telegram." });
    } finally {
      setDetectingChatId(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFeedback(null);
    fetch(`${API_BASE}/alerts/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSettings({
            telegram_enabled: data.telegram_enabled ?? true,
            telegram_bot_token: data.telegram_bot_token || "",
            telegram_chat_id: data.telegram_chat_id || "",
            min_score_filter: data.min_score_filter ?? 75.0,
            enable_pre_ara_alerts: data.enable_pre_ara_alerts ?? true,
            enable_bpjs_alerts: data.enable_bpjs_alerts ?? true,
            enable_bsjp_alerts: data.enable_bsjp_alerts ?? true,
            enable_confluence_alerts: data.enable_confluence_alerts ?? true,
            enable_execution_alerts: data.enable_execution_alerts ?? true,
          });
        }
      })
      .catch((err) => {
        setFeedback({ type: "error", message: `Gagal memuat pengaturan: ${err.message}` });
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/alerts/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Pengaturan notifikasi berhasil disimpan." });
      } else {
        throw new Error(data.detail || "Gagal menyimpan pengaturan.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Terjadi kesalahan sistem saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      setFeedback({ type: "error", message: "Masukkan Bot Token dan Chat ID terlebih dahulu untuk uji coba." });
      return;
    }

    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/alerts/test-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: settings.telegram_bot_token,
          chat_id: settings.telegram_chat_id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          message: "[SUCCESS] Notifikasi sampel taktis berhasil dikirim ke Telegram Anda!",
        });
      } else {
        throw new Error(data.detail || "Gagal mengirim pesan uji coba.");
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `[ERROR] ${err.message || "Periksa kembali Bot Token dan Chat ID Anda."}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-cardBg border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Telegram Instant Webhook Engine</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  [TELEGRAM BOT]
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurasi notifikasi langsung untuk sinyal konviksi tinggi dan eksekusi bot.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
              <span className="font-mono text-slate-400">Memuat konfigurasi...</span>
            </div>
          ) : (
            <>
              {/* Feedback Banner */}
              {feedback && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 font-mono ${
                    feedback.type === "success"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/50 text-rose-300"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Bot Guide Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                    Panduan Cepat Menghubungkan Bot
                  </span>
                  <a
                    href="https://t.me/ihsgslayer_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 underline"
                  >
                    <span>Buka @ihsgslayer_bot</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>
                    Buka link <a href="https://t.me/ihsgslayer_bot" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-bold">t.me/ihsgslayer_bot</a> di Telegram Anda lalu tekan <strong>START</strong>.
                  </li>
                  <li>
                    Klik tombol <strong className="text-sky-300">"Deteksi Otomatis"</strong> di atas kolom Chat ID untuk mengisi ID Telegram Anda secara instan.
                  </li>
                  <li>
                    Klik <strong>"Uji Coba Notifikasi"</strong> untuk memverifikasi penerimaan sinyal playbook taktis.
                  </li>
                </ol>
              </div>

              {/* Telegram Activation Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">Aktifkan Notifikasi Telegram</span>
                  <span className="text-[11px] text-slate-400">
                    Kirim alert playbook setiap kali ada sinyal konviksi tinggi atau penutupan posisi.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.telegram_enabled}
                  onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                  className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                />
              </div>

              {/* Credentials Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Telegram Bot Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={settings.telegram_bot_token}
                      onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Telegram Chat ID
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectChatId}
                      disabled={detectingChatId || !settings.telegram_bot_token}
                      className="text-[10px] font-mono font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                      {detectingChatId ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                      <span>{detectingChatId ? "Mencari..." : "Deteksi Otomatis"}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    placeholder="Contoh: 123456789 atau -100123456789"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Min AI Score Threshold Slider */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-slate-300 font-bold text-xs">
                    Ambang Batas Minimal Skor AI:
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    &gt;= {settings.min_score_filter} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={90}
                  step={1}
                  value={settings.min_score_filter}
                  onChange={(e) => setSettings({ ...settings, min_score_filter: Number(e.target.value) })}
                  className="w-full accent-indigo-400 h-1.5 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">
                  Hanya sinyal dengan skor di atas ambang ini yang akan memicu notifikasi instan. Rekomendasi: &gt;= 75 (High &amp; Ultra).
                </p>
              </div>

              {/* Strategy Alert Toggles */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Pilih Strategi yang Memicu Alert:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "enable_bpjs_alerts", label: "[BPJS] Beli Pagi Jual Sore (09:15 WIB)" },
                    { key: "enable_bsjp_alerts", label: "[BSJP] Beli Sore Jual Pagi (15:45 WIB)" },
                    { key: "enable_pre_ara_alerts", label: "[PRE-ARA] Calon Top Gainer Volume Surge" },
                    { key: "enable_confluence_alerts", label: "[CONFLUENCE] Super Cluster Multi-Signal" },
                    { key: "enable_execution_alerts", label: "[EKSEKUSI] Laporan Realisasi TP/SL Bot" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer text-[11px] font-mono"
                    >
                      <input
                        type="checkbox"
                        checked={(settings as any)[item.key]}
                        onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                        className="w-3.5 h-3.5 accent-sky-500 rounded"
                      />
                      <span className="text-slate-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleTestNotification}
            disabled={testing || loading || !settings.telegram_bot_token || !settings.telegram_chat_id}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 font-mono font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{testing ? "Mengirim..." : "Kirim Pesan Uji Coba"}</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-mono transition-all"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50 transition-all"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
