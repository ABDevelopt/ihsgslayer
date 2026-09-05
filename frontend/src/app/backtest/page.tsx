"use client";


import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronUp,
  Filter,
  FlaskConical,
  Info,
  Play,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";
import { ShariaBadge } from "@/components/ShariaBadge";

import { useState, useCallback } from "react";
import StrategyHubNav from "@/components/StrategyHubNav";
import { getApiBase } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";
const API = getApiBase();
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const PATTERN_OPTIONS = ["AREA_DEMAND","THROWBACK_RETEST","LIQUIDITY_SWEEP","EARLY_BREAKOUT"];

function fmt(n: number | null | undefined, d = 2): string {
  if (n == null || isNaN(Number(n))) return "\u2014";
  return Number(n).toFixed(d);
}
function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "\u2014";
  return (Number(n) > 0 ? "+" : "") + Number(n).toFixed(2) + "%";
}
function fmtRupiah(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}
function clr(v: number, g: number, b: number, inv = false): string {
  if (!inv) return v >= g ? "text-emerald-400" : v <= b ? "text-rose-400" : "text-amber-400";
  return v <= g ? "text-emerald-400" : v >= b ? "text-rose-400" : "text-amber-400";
}

interface KPIProps { label: string; value: string; color?: string; tip?: string; }
function KPICard({ label, value, color = "text-slate-100", tip }: KPIProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        {tip && <button onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} className="text-slate-600 hover:text-slate-400"><Info className="w-2.5 h-2.5"/></button>}
      </div>
      <span className={`text-xl font-bold font-mono ${color}`}>{value}</span>
      {show && tip && <div className="absolute bottom-full left-0 mb-1 z-50 w-52 p-2 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-slate-300 shadow-xl">{tip}</div>}
    </div>
  );
}

export default function BacktestStudioPage() {
  const [capital, setCapital] = useState(100_000_000);
  const [maxPos, setMaxPos] = useState(5);
  const [posSz, setPosSz] = useState(20);
  const [minSc, setMinSc] = useState(70);
  const [tp, setTp] = useState(15);
  const [sl, setSl] = useState(6);
  const [maxD, setMaxD] = useState(25);
  const [pats, setPats] = useState<string[]>([...PATTERN_OPTIONS]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const [tab, setTab] = useState<"chart"|"kpi"|"trades"|"stats">("chart");
  const [tf, setTf] = useState("ALL");
  const [wfExp, setWfExp] = useState(false);
  const [wfRes, setWfRes] = useState<any>(null);
  const [mcRes, setMcRes] = useState<any>(null);
  const [wfRun, setWfRun] = useState(false);
  const [mcRun, setMcRun] = useState(false);

  const togPat = (p: string) => setPats(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev,p]);

  const runBacktest = useCallback(async () => {
    setRunning(true); setErr(null); setResult(null);
    try {
      const r = await fetch(`${API}/backtest/run`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          initial_capital:capital, max_portfolio_positions:maxPos,
          position_size_pct:posSz/100, min_ai_score:minSc,
          take_profit_pct:tp/100, stop_loss_pct:sl/100,
          max_holding_days:maxD, target_patterns:pats,
          buy_fee_pct:0.0015, sell_fee_pct:0.0025, slippage_pct:0.001
        })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setResult(await r.json()); setTab("chart");
    } catch(e:any) { setErr(e.message); }
    finally { setRunning(false); }
  }, [capital,maxPos,posSz,minSc,tp,sl,maxD,pats]);

  const runWF = async () => {
    setWfRun(true);
    try {
      const r = await fetch(`${API}/backtest/walk-forward`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({train_days:120,test_days:40})
      });
      setWfRes(await r.json());
    } catch { setWfRes({error:"Gagal"}); } finally { setWfRun(false); }
  };

  const runMC = async () => {
    setMcRun(true);
    try {
      const r = await fetch(`${API}/backtest/monte-carlo`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({num_simulations:500})
      });
      setMcRes(await r.json());
    } catch { setMcRes({error:"Gagal"}); } finally { setMcRun(false); }
  };

  const tm = result?.trade_metrics||{};
  const em = result?.equity_metrics||{};
  const cs = result?.consecutive_stats||{};
  const dsr = result?.deflated_sharpe||{};
  const hm: any[] = result?.monthly_heatmap?.matrix||[];
  const dd: any[] = result?.drawdown_periods||[];
  const trades: any[] = result?.closed_trades||[];

  const eqDD = (() => {
    if (!result?.equity_curve?.length) return [];
    let rmax = result.equity_curve[0]?.portfolio_value || capital;
    return result.equity_curve.map((d:any) => {
      rmax = Math.max(rmax, d.portfolio_value);
      return {...d, drawdown: parseFloat((((d.portfolio_value-rmax)/rmax)*100).toFixed(2))};
    });
  })();

  const filteredTrades = tf==="ALL" ? trades
    : tf==="WIN" ? trades.filter(t=>t.pnl_pct>0)
    : tf==="LOSS" ? trades.filter(t=>t.pnl_pct<0)
    : trades.filter(t=>t.exit_reason===tf);

  const pnlBins = (() => {
    if (!trades.length) return [];
    const b: Record<string,{label:string;count:number;positive:boolean}> = {};
    trades.forEach(t => {
      const k = Math.floor((t.pnl_pct||0)/3)*3;
      const key = String(k);
      if (!b[key]) b[key]={label:`${k}~${k+3}%`,count:0,positive:k>=0};
      b[key].count++;
    });
    return Object.values(b).sort((a,c)=>parseFloat(a.label)-parseFloat(c.label));
  })();

  const TABS = [
    {key:"chart" as const, label:"Equity Curve", icon:TrendingUp},
    {key:"kpi" as const, label:"KPI Dashboard", icon:Activity},
    {key:"trades" as const, label:"Trade Log", icon:Target},
    {key:"stats" as const, label:"Validasi Statistik", icon:FlaskConical},
  ];
  const FILTERS = ["ALL","WIN","LOSS","TAKE_PROFIT","STOP_LOSS","TIME_STOP"];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Quant Lab Hub Navigation */}
      <StrategyHubNav
        hubTitle="Studio Riset & Simulasi Kuantitatif"
        hubBadge="QUANT LAB"
        badgeVariant="indigo"
        description="Pusat pengujian strategi trading: Simulasi historis event-driven (Backtest dengan DSR) dan eksekusi robot forward-testing tanpa risiko modal riil."
        tabs={[
          { href: "/backtest", label: "Studio Backtest (Historis)", icon: BarChart3, badge: "DSR & Walk-Forward" },
          { href: "/forward-test", label: "Studio Forward Test (Live Bot)", icon: Bot, badge: "Virtual Trading" },
        ]}
      />


      {/* HEADER + CONFIG */}
      <div className="p-5 rounded-2xl bg-cardBg border border-indigo-500/40 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">QUANT SIMULATOR v2</span>
              <span className="text-[10px] text-slate-400 font-mono">Event-Driven · Multi-Asset · IDX BEI · 250 Hari</span>
            </div>
            <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
              <BarChart3 className="w-6 h-6 text-indigo-400"/>Studio Backtest Strategi Kuantitatif
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl">
              Simulasi event-driven historis · slippage IDX 0.1% · biaya broker 0.15%/0.25% · lot size 100 lembar · Market Regime Gatekeeper.
            </p>
          </div>
          <button onClick={runBacktest} disabled={running}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 shrink-0">
            {running?<RefreshCw className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>}
            {running?"Simulasi Berjalan...":"Jalankan Simulasi"}
          </button>
        </div>

        {/* Sliders */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            {label:"Modal Awal", val:fmtRupiah(capital), cls:"accent-indigo-400",
              el:<input type="range" min={5000000} max={500000000} step={5000000} value={capital} onChange={e=>setCapital(+e.target.value)} className="w-full accent-indigo-400 h-1"/>},
            {label:"Max Posisi", val:`${maxPos} slot`, cls:"accent-indigo-400",
              el:<input type="range" min={1} max={10} value={maxPos} onChange={e=>setMaxPos(+e.target.value)} className="w-full accent-indigo-400 h-1"/>},
            {label:"Ukuran Posisi", val:`${posSz}%`, cls:"accent-indigo-400",
              el:<input type="range" min={5} max={30} value={posSz} onChange={e=>setPosSz(+e.target.value)} className="w-full accent-indigo-400 h-1"/>},
            {label:"Min AI Score", val:`>=${minSc}`, cls:"accent-indigo-400",
              el:<input type="range" min={50} max={90} value={minSc} onChange={e=>setMinSc(+e.target.value)} className="w-full accent-indigo-400 h-1"/>},
            {label:"Take Profit", val:`${tp}%`, cls:"accent-emerald-400",
              el:<input type="range" min={5} max={40} value={tp} onChange={e=>setTp(+e.target.value)} className="w-full accent-emerald-400 h-1"/>},
            {label:"Stop Loss", val:`${sl}%`, cls:"accent-rose-400",
              el:<input type="range" min={2} max={15} value={sl} onChange={e=>setSl(+e.target.value)} className="w-full accent-rose-400 h-1"/>},
            {label:"Max Hold (h)", val:`${maxD}d`, cls:"accent-amber-400",
              el:<input type="range" min={5} max={60} value={maxD} onChange={e=>setMaxD(+e.target.value)} className="w-full accent-amber-400 h-1"/>},
          ].map(({label,val,el})=>(
            <div key={label} className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase">{label}</span>
                <span className="text-[10px] font-mono text-slate-200 font-bold">{val}</span>
              </div>
              {el}
            </div>
          ))}
        </div>

        {/* Patterns */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono text-slate-500">Pola Target:</span>
          {PATTERN_OPTIONS.map(p=>(
            <button key={p} onClick={()=>togPat(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${pats.includes(p)?"bg-indigo-500/20 text-indigo-300 border-indigo-500/50":"bg-slate-900 text-slate-500 border-slate-700"}`}>
              {p.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      {/* ERROR */}
      {err && (
        <div className="p-4 rounded-xl bg-rose-900/20 border border-rose-500/40 text-rose-300 text-sm font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0"/>{err}
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <>
          {/* TABS */}
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit flex-wrap">
            {TABS.map(({key,label,icon:Icon})=>(
              <button key={key} onClick={()=>setTab(key)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all ${tab===key?"bg-indigo-500/20 text-indigo-300 border border-indigo-500/40":"text-slate-500 hover:text-slate-300"}`}>
                <Icon className="w-3 h-3"/>{label}
              </button>
            ))}
          </div>

          {/* TAB: EQUITY CURVE */}
          {tab==="chart" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Total Return" value={fmtPct(em.total_return_pct)} color={clr(em.total_return_pct||0,20,0)} tip="(Nilai Akhir - Modal Awal) / Modal Awal"/>
                <KPICard label="CAGR" value={fmtPct(em.cagr_pct)} color={clr(em.cagr_pct||0,25,0)} tip="Compound Annual Growth Rate"/>
                <KPICard label="Max Drawdown" value={`-${fmt(em.max_drawdown_pct)}%`} color={clr(em.max_drawdown_pct||0,5,15,true)} tip="Puncak ke lembah terbesar"/>
                <KPICard label="Modal Akhir" value={fmtRupiah(eqDD[eqDD.length-1]?.portfolio_value)}/>
              </div>

              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">Kurva Ekuitas Portofolio</h4>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={eqDD} margin={{top:5,right:10,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="date" tick={{fontSize:9,fill:"#64748b"}} tickLine={false} tickFormatter={d=>String(d).slice(5,10)}/>
                    <YAxis tick={{fontSize:9,fill:"#64748b"}} tickLine={false} tickFormatter={v=>`${(v/1_000_000).toFixed(0)}Jt`}/>
                    <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:10}} formatter={(v:any,n:any)=>[fmtRupiah(Number(v)),n]}/>
                    <ReferenceLine y={capital} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1}/>
                    <Area type="monotone" dataKey="portfolio_value" name="Portofolio" stroke="#6366f1" fill="url(#eqG)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">Underwater Drawdown (%)</h4>
                <ResponsiveContainer width="100%" height={110}>
                  <AreaChart data={eqDD} margin={{top:5,right:10,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="ddG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="date" tick={{fontSize:8,fill:"#64748b"}} tickLine={false} tickFormatter={d=>String(d).slice(5,10)}/>
                    <YAxis tick={{fontSize:8,fill:"#64748b"}} tickLine={false} tickFormatter={v=>`${v.toFixed(1)}%`}/>
                    <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:10}} formatter={(v:any)=>[`${Number(v).toFixed(2)}%`,"DD"]}/>
                    <ReferenceLine y={0} stroke="#64748b" strokeWidth={1}/>
                    <Area type="monotone" dataKey="drawdown" stroke="#f43f5e" fill="url(#ddG)" strokeWidth={1.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
                {dd.length>0 && (
                  <div className="mt-3 overflow-x-auto">
                    <p className="text-[9px] font-mono text-slate-500 mb-1.5">Top Drawdown Periods</p>
                    <table className="w-full text-[10px] font-mono">
                      <thead><tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left pb-1 pr-3">Mulai</th><th className="text-left pb-1 pr-3">Trough</th>
                        <th className="text-right pb-1 pr-3">Maks DD</th><th className="text-right pb-1 pr-3">Durasi</th>
                        <th className="text-right pb-1">Recovery</th>
                      </tr></thead>
                      <tbody>{dd.slice(0,5).map((p:any,i:number)=>(
                        <tr key={i} className="border-b border-slate-800/40">
                          <td className="py-1 pr-3 text-slate-300">{p.start_date}</td>
                          <td className="py-1 pr-3 text-slate-300">{p.trough_date}</td>
                          <td className="py-1 pr-3 text-right text-rose-400 font-bold">{p.max_drawdown_pct}%</td>
                          <td className="py-1 pr-3 text-right text-slate-300">{p.duration_days}h</td>
                          <td className="py-1 text-right text-slate-400">{p.recovery_days!=null?`${p.recovery_days}h`:"\u2013"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: KPI */}
          {tab==="kpi" && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Trophy className="w-3 h-3"/>Metrik Trade</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KPICard label="Win Rate" value={`${fmt(tm.win_rate_pct)}%`} color={clr(tm.win_rate_pct||0,60,40)} tip="% trade positif"/>
                  <KPICard label="Total Trade" value={String(tm.total_trades||0)} tip="Total transaksi selesai"/>
                  <KPICard label="Profit Factor" value={`${fmt(tm.profit_factor)}x`} color={clr(tm.profit_factor||0,1.5,1.0)} tip="Gross Profit / Gross Loss. >2.0 sangat baik"/>
                  <KPICard label="Expectancy" value={fmtPct(tm.expectancy_pct)} color={clr(tm.expectancy_pct||0,2,0)} tip="WR*AvgWin - LR*|AvgLoss|"/>
                  <KPICard label="Avg Win" value={fmtPct(tm.avg_win_pct)} color="text-emerald-400"/>
                  <KPICard label="Avg Loss" value={fmtPct(tm.avg_loss_pct)} color="text-rose-400"/>
                  <KPICard label="Max Win" value={fmtPct(tm.max_win_pct)} color="text-emerald-300"/>
                  <KPICard label="Max Loss" value={fmtPct(tm.max_loss_pct)} color="text-rose-300"/>
                  <KPICard label="Avg Holding" value={`${fmt(tm.avg_holding_days,1)}d`} tip="Rata-rata durasi posisi"/>
                  <KPICard label="Streak Menang Max" value={String(cs.max_consecutive_wins||0)} color="text-emerald-400"/>
                  <KPICard label="Streak Kalah Max" value={String(cs.max_consecutive_losses||0)} color="text-rose-400"/>
                  <KPICard label="Streak Saat Ini" value={cs.current_streak>0?`+${cs.current_streak}W`:cs.current_streak<0?`${cs.current_streak}L`:"Flat"} color={cs.current_streak>0?"text-emerald-400":cs.current_streak<0?"text-rose-400":"text-slate-400"}/>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap className="w-3 h-3"/>Metrik Portofolio</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KPICard label="Total Return" value={fmtPct(em.total_return_pct)} color={clr(em.total_return_pct||0,20,0)}/>
                  <KPICard label="CAGR" value={fmtPct(em.cagr_pct)} color={clr(em.cagr_pct||0,25,0)}/>
                  <KPICard label="Ann. Volatility" value={`${fmt(em.annualized_volatility_pct)}%`} color={clr(em.annualized_volatility_pct||0,15,30,true)} tip="StdDev return harian x sqrt(250)"/>
                  <KPICard label="Sharpe Ratio" value={fmt(em.sharpe_ratio)} color={clr(em.sharpe_ratio||0,1.5,0.5)} tip="(CAGR-BI6%) / Volatilitas. >1.5 unggul"/>
                  <KPICard label="Sortino Ratio" value={fmt(em.sortino_ratio)} color={clr(em.sortino_ratio||0,2.0,0.5)} tip="Seperti Sharpe tapi hanya downside deviation"/>
                  <KPICard label="Max Drawdown" value={`-${fmt(em.max_drawdown_pct)}%`} color={clr(em.max_drawdown_pct||0,5,20,true)}/>
                  <KPICard label="Calmar Ratio" value={fmt(em.calmar_ratio)} color={clr(em.calmar_ratio||0,2.0,0.5)} tip="CAGR / MaxDD. >2.0 manajemen risiko baik"/>
                  <KPICard label="Alpha vs IHSG" value={fmtPct(em.alpha_pct)} color={clr(em.alpha_pct||0,5,0)} tip="Excess return vs benchmark CAPM"/>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TRADES */}
          {tab==="trades" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">Distribusi PnL per Trade (%)</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={pnlBins} margin={{top:5,right:10,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize:8,fill:"#64748b"}} tickLine={false}/>
                    <YAxis tick={{fontSize:8,fill:"#64748b"}} tickLine={false}/>
                    <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:10}} formatter={(v:any)=>[v,"Trade"]}/>
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {pnlBins.map((e,i)=><Cell key={i} fill={e.positive?"#10b981":"#f43f5e"} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Filter className="w-3 h-3 text-slate-400"/>
                  {FILTERS.map(f=>(
                    <button key={f} onClick={()=>setTf(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${tf===f?"bg-indigo-500/20 text-indigo-300 border-indigo-500/40":"bg-slate-900 text-slate-500 border-slate-700"}`}>{f}</button>
                  ))}
                  <span className="ml-auto text-[10px] font-mono text-slate-500">{filteredTrades.length} transaksi</span>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead className="sticky top-0 bg-cardBg">
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left pb-1.5 pr-3">Emiten</th><th className="text-left pb-1.5 pr-3">Entry</th>
                        <th className="text-left pb-1.5 pr-3">Exit</th><th className="text-right pb-1.5 pr-3">Beli</th>
                        <th className="text-right pb-1.5 pr-3">Jual</th><th className="text-right pb-1.5 pr-3">PnL%</th>
                        <th className="text-right pb-1.5 pr-3">Hari</th><th className="text-left pb-1.5">Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.slice(0,200).map((t:any,i:number)=>(
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                          <td className="py-1 pr-3 text-slate-200 font-bold"><span className="flex items-center gap-1.5">{t.symbol?.replace(".JK","")}<ShariaBadge symbol={t.symbol} /></span></td>
                          <td className="py-1 pr-3 text-slate-400">{String(t.entry_date).slice(0,10)}</td>
                          <td className="py-1 pr-3 text-slate-400">{String(t.exit_date).slice(0,10)}</td>
                          <td className="py-1 pr-3 text-right text-slate-300">{(t.entry_price||0).toFixed(0)}</td>
                          <td className="py-1 pr-3 text-right text-slate-300">{(t.exit_price||0).toFixed(0)}</td>
                          <td className={`py-1 pr-3 text-right font-bold ${t.pnl_pct>=0?"text-emerald-400":"text-rose-400"}`}>{fmtPct(t.pnl_pct)}</td>
                          <td className="py-1 pr-3 text-right text-slate-400">{t.holding_days}</td>
                          <td className="py-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.exit_reason==="TAKE_PROFIT"?"bg-emerald-500/15 text-emerald-400":t.exit_reason==="STOP_LOSS"?"bg-rose-500/15 text-rose-400":"bg-amber-500/15 text-amber-400"}`}>
                              {t.exit_reason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STATS */}
          {tab==="stats" && (
            <div className="space-y-4">
              {/* DSR */}
              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <h4 className="text-xs font-mono text-slate-300 font-bold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400"/>Deflated Sharpe Ratio (DSR) — Bailey &amp; Lopez de Prado 2014
                </h4>
                {Object.keys(dsr).length>0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">Observed Sharpe</p>
                      <p className="text-2xl font-bold font-mono text-indigo-400">{fmt(dsr.observed_sharpe)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">DSR Probability</p>
                      <p className={`text-2xl font-bold font-mono ${(dsr.deflated_sharpe_prob||0)>=0.95?"text-emerald-400":"text-amber-400"}`}>
                        {(((dsr.deflated_sharpe_prob||0)*100).toFixed(1))}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${dsr.is_statistically_significant?"bg-emerald-900/20 border-emerald-500/40":"bg-amber-900/20 border-amber-500/40"}`}>
                      <p className="text-[9px] font-mono text-slate-500 mb-1">Status Alpha</p>
                      <p className={`text-sm font-bold font-mono ${dsr.is_statistically_significant?"text-emerald-400":"text-amber-400"}`}>
                        {dsr.is_statistically_significant?"SIGNIFIKAN":"MUNGKIN OVERFITTING"}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">DSR &gt;= 95% = Alpha Sejati</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">Skewness</p>
                      <p className="text-lg font-bold font-mono text-slate-200">{fmt(dsr.skewness)}</p>
                      <p className="text-[9px] text-slate-500">&gt;0 = ekor kanan tebal</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">Kurtosis</p>
                      <p className="text-lg font-bold font-mono text-slate-200">{fmt(dsr.kurtosis)}</p>
                      <p className="text-[9px] text-slate-500">3=normal, &gt;3=fat tail</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500 mb-1">Trials Adjusted</p>
                      <p className="text-lg font-bold font-mono text-slate-200">{dsr.trials_adjusted}</p>
                    </div>
                  </div>
                ) : <p className="text-[10px] font-mono text-slate-500">Jalankan simulasi terlebih dahulu.</p>}
              </div>

              {/* Walk-Forward */}
              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono text-slate-300 font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400"/>Walk-Forward Cross Validation (OOS)
                  </h4>
                  <button onClick={runWF} disabled={wfRun}
                    className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30 flex items-center gap-1.5 disabled:opacity-50">
                    {wfRun?<RefreshCw className="w-3 h-3 animate-spin"/>:<Play className="w-3 h-3"/>}
                    {wfRun?"Berjalan...":"Jalankan WF"}
                  </button>
                </div>
                {wfRes && !wfRes.error ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <p className="text-[9px] font-mono text-slate-500">Segmen OOS</p>
                        <p className="text-xl font-bold font-mono text-cyan-400">{wfRes.total_segments}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <p className="text-[9px] font-mono text-slate-500">Avg OOS Sharpe</p>
                        <p className={`text-xl font-bold font-mono ${(wfRes.avg_oos_sharpe||0)>=1?"text-emerald-400":"text-amber-400"}`}>{fmt(wfRes.avg_oos_sharpe)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <p className="text-[9px] font-mono text-slate-500">Avg OOS Win Rate</p>
                        <p className="text-xl font-bold font-mono text-slate-200">{fmt(wfRes.avg_oos_win_rate_pct)}%</p>
                      </div>
                    </div>
                    <button onClick={()=>setWfExp(!wfExp)} className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300">
                      {wfExp?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
                      {wfExp?"Sembunyikan":"Lihat"} detail segmen
                    </button>
                    {wfExp && wfRes.segments?.length>0 && (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-[10px] font-mono">
                          <thead><tr className="text-slate-500 border-b border-slate-800">
                            <th className="text-left pb-1 pr-3">Seg</th><th className="text-left pb-1 pr-3">Mulai</th>
                            <th className="text-left pb-1 pr-3">Akhir</th><th className="text-right pb-1 pr-3">Sharpe OOS</th>
                            <th className="text-right pb-1">Win Rate</th>
                          </tr></thead>
                          <tbody>{wfRes.segments.map((s:any,i:number)=>(
                            <tr key={i} className="border-b border-slate-800/40">
                              <td className="py-1 pr-3 text-slate-300">{s.segment}</td>
                              <td className="py-1 pr-3 text-slate-400">{s.start_date}</td>
                              <td className="py-1 pr-3 text-slate-400">{s.end_date}</td>
                              <td className={`py-1 pr-3 text-right font-bold ${(s.equity_metrics?.sharpe_ratio||0)>=1?"text-emerald-400":"text-amber-400"}`}>{fmt(s.equity_metrics?.sharpe_ratio)}</td>
                              <td className="py-1 text-right text-slate-300">{fmt(s.trade_metrics?.win_rate_pct)}%</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : <p className="text-[10px] font-mono text-slate-500">Klik "Jalankan WF" untuk validasi out-of-sample.</p>}
              </div>

              {/* Monte Carlo */}
              <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono text-slate-300 font-bold flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-violet-400"/>Monte Carlo Permutation Test (N=500)
                  </h4>
                  <button onClick={runMC} disabled={mcRun}
                    className="px-3 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-[10px] font-mono font-bold border border-violet-500/30 flex items-center gap-1.5 disabled:opacity-50">
                    {mcRun?<RefreshCw className="w-3 h-3 animate-spin"/>:<Play className="w-3 h-3"/>}
                    {mcRun?"Simulasi...":"Jalankan MC"}
                  </button>
                </div>
                {mcRes && !mcRes.error ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Profit Factor Asli</p>
                      <p className="text-xl font-bold font-mono text-violet-400">{fmt(mcRes.original_profit_factor)}x</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Max DD P95 (worst)</p>
                      <p className="text-xl font-bold font-mono text-rose-400">-{fmt(mcRes.mc_max_dd_95th_percentile_pct)}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Max DD Median</p>
                      <p className="text-xl font-bold font-mono text-amber-400">-{fmt(mcRes.mc_max_dd_median_pct)}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Ekuitas P5 (terburuk)</p>
                      <p className="text-lg font-bold font-mono text-slate-300">{fmtRupiah(mcRes.mc_equity_5th_percentile)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Ekuitas Median</p>
                      <p className="text-lg font-bold font-mono text-emerald-400">{fmtRupiah(mcRes.mc_equity_median)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                      <p className="text-[9px] font-mono text-slate-500">Simulasi</p>
                      <p className="text-xl font-bold font-mono text-violet-300">{mcRes.num_simulations?.toLocaleString()}</p>
                    </div>
                  </div>
                ) : <p className="text-[10px] font-mono text-slate-500">Klik "Jalankan MC" untuk uji permutasi Monte Carlo.</p>}
              </div>

              {/* Monthly Heatmap */}
              {hm.length>0 && (
                <div className="p-4 rounded-2xl bg-cardBg border border-slate-800">
                  <h4 className="text-xs font-mono text-slate-300 font-bold mb-3">Monthly Return Heatmap (%)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono">
                      <thead><tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left pb-1.5 pr-2">Tahun</th>
                        {MONTH_NAMES.map(m=><th key={m} className="text-center pb-1.5 px-1 min-w-[34px]">{m}</th>)}
                        <th className="text-right pb-1.5 pl-2">Total</th>
                      </tr></thead>
                      <tbody>{hm.map((row:any)=>{
                        const total=MONTH_NAMES.reduce((s,m)=>s+(row[m]||0),0);
                        return (
                          <tr key={row.year} className="border-b border-slate-800/40">
                            <td className="py-1 pr-2 text-slate-300 font-bold">{row.year}</td>
                            {MONTH_NAMES.map(m=>{
                              const v=row[m];
                              const cl=v==null?"text-slate-700":v>=5?"bg-emerald-500/30 text-emerald-300":v>=2?"bg-emerald-500/15 text-emerald-400":v>=0?"bg-emerald-900/20 text-emerald-600":v>=-3?"bg-rose-900/20 text-rose-500":v>=-7?"bg-rose-500/15 text-rose-400":"bg-rose-500/30 text-rose-300";
                              return <td key={m} className={`py-1 px-0.5 text-center rounded font-bold ${cl}`}>{v!=null?(v>0?`+${v.toFixed(1)}`:v.toFixed(1)):"\u2014"}</td>;
                            })}
                            <td className={`py-1 pl-2 text-right font-bold ${total>=0?"text-emerald-400":"text-rose-400"}`}>
                              {total>=0?`+${total.toFixed(1)}`:total.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!result && !running && !err && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <BarChart3 className="w-12 h-12 text-indigo-500/30"/>
          <p className="text-sm text-slate-500 font-mono">Atur parameter strategi di atas, lalu tekan</p>
          <p className="text-indigo-400 font-mono font-bold text-sm">&#9654; Jalankan Simulasi</p>
          <p className="text-xs text-slate-600 font-mono max-w-md">
            Simulasi 250 hari historis pada semesta BEI aktif dengan slippage, biaya broker, dan lot size 100 lembar seperti kondisi nyata.
          </p>
        </div>
      )}
    </div>
  );
}
