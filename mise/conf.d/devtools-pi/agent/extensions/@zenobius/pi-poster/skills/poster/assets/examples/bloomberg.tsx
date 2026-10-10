
export default function Poster() {
  const amber = "#ffb000";
  const green = "#00ff66";
  const red = "#ff3b3b";
  const dim = "#8a6a00";

  const tickers = [
    { sym: "AAPL US",  name: "APPLE INC",             bid: 227.42, ask: 227.44, last: 227.43, chg: +1.82, pct: +0.81, vol: "48.2M" },
    { sym: "MSFT US",  name: "MICROSOFT CORP",        bid: 428.11, ask: 428.14, last: 428.12, chg: -2.14, pct: -0.50, vol: "22.7M" },
    { sym: "NVDA US",  name: "NVIDIA CORP",           bid: 118.76, ask: 118.78, last: 118.77, chg: +3.44, pct: +2.98, vol: "312.4M" },
    { sym: "TSLA US",  name: "TESLA INC",             bid: 241.03, ask: 241.07, last: 241.05, chg: -5.21, pct: -2.12, vol: "94.1M" },
    { sym: "AMZN US",  name: "AMAZON.COM INC",        bid: 189.55, ask: 189.58, last: 189.57, chg: +0.42, pct: +0.22, vol: "41.8M" },
    { sym: "GOOGL US", name: "ALPHABET INC-CL A",     bid: 172.91, ask: 172.94, last: 172.92, chg: +0.08, pct: +0.05, vol: "19.3M" },
    { sym: "META US",  name: "META PLATFORMS INC-A",  bid: 582.30, ask: 582.36, last: 582.33, chg: -1.77, pct: -0.30, vol: "13.6M" },
    { sym: "JPM US",   name: "JPMORGAN CHASE & CO",   bid: 221.18, ask: 221.22, last: 221.20, chg: +2.05, pct: +0.94, vol: "8.9M"  },
  ];

  const fmt = (n: number, d = 2) => n.toFixed(d);
  const sign = (n: number) => (n >= 0 ? "+" : "");

  const mono = { fontFamily: "'JetBrains Mono', monospace" };

  return (
    <div className="w-[1600px] bg-black p-6" style={{ ...mono, color: amber }}>
      <div className="flex items-center justify-between border-b pb-2 text-[15px]" style={{ borderColor: dim }}>
        <div className="flex gap-6">
          <span className="font-bold">BLOOMBERG PROFESSIONAL</span>
          <span style={{ color: dim }}>EQUITY · WATCH</span>
          <span style={{ color: dim }}>MONITOR-01</span>
        </div>
        <div className="flex gap-6">
          <span>USER: MLIV &lt;GO&gt;</span>
          <span style={{ color: dim }}>16-APR-2026  14:32:07 EDT</span>
        </div>
      </div>

      <div className="mt-3 text-[15px]">
        <span style={{ color: dim }}>&gt; </span>
        <span>WATCHLIST </span>
        <span style={{ color: "#fff" }}>MEGA CAP US</span>
        <span style={{ color: dim }}> &lt;EQUITY&gt; &lt;GO&gt;</span>
        <span className="ml-2 inline-block" style={{ background: amber, color: "#000" }}>&nbsp;</span>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-3 border-y py-2 text-[14px]" style={{ borderColor: dim }}>
        {[
          { k: "SPX",   v: "5,842.13", c: +0.42 },
          { k: "INDU",  v: "42,117.88", c: +0.31 },
          { k: "CCMP",  v: "18,912.04", c: +0.88 },
          { k: "RTY",   v: "2,241.77", c: -0.19 },
          { k: "VIX",   v: "14.82",    c: -2.11 },
          { k: "USGG10YR", v: "4.287%", c: +0.04 },
        ].map((x) => (
          <div key={x.k} className="flex justify-between">
            <span style={{ color: dim }}>{x.k}</span>
            <span>{x.v}</span>
            <span style={{ color: x.c >= 0 ? green : red }}>
              {sign(x.c)}{fmt(x.c)}%
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-4 grid text-[14px] font-bold"
        style={{ gridTemplateColumns: "100px 1fr 110px 110px 110px 110px 110px 110px", color: "#000", background: amber, padding: "4px 8px" }}
      >
        <span>TICKER</span>
        <span>NAME</span>
        <span className="text-right">BID</span>
        <span className="text-right">ASK</span>
        <span className="text-right">LAST</span>
        <span className="text-right">CHG</span>
        <span className="text-right">%CHG</span>
        <span className="text-right">VOL</span>
      </div>

      {tickers.map((t, i) => {
        const up = t.chg >= 0;
        const col = up ? green : red;
        return (
          <div
            key={t.sym}
            className="grid text-[15px] tabular-nums"
            style={{
              gridTemplateColumns: "100px 1fr 110px 110px 110px 110px 110px 110px",
              padding: "6px 8px",
              background: i % 2 ? "#0a0a0a" : "transparent",
              borderBottom: `1px solid ${dim}33`,
            }}
          >
            <span className="font-bold">{t.sym}</span>
            <span style={{ color: "#d9d9d9" }}>{t.name}</span>
            <span className="text-right">{fmt(t.bid)}</span>
            <span className="text-right">{fmt(t.ask)}</span>
            <span className="text-right font-bold">{fmt(t.last)}</span>
            <span className="text-right" style={{ color: col }}>{sign(t.chg)}{fmt(t.chg)}</span>
            <span className="text-right" style={{ color: col }}>{sign(t.pct)}{fmt(t.pct)}%</span>
            <span className="text-right" style={{ color: dim }}>{t.vol}</span>
          </div>
        );
      })}

      <div className="mt-5 border-t pt-2 text-[14px]" style={{ borderColor: dim }}>
        <div style={{ color: dim }}>HEADLINES · TOP &lt;GO&gt;</div>
        {[
          "14:31  NVDA  Blackwell Ultra shipments ahead of plan — sources",
          "14:28  FOMC  Minutes signal patience on rate path; USD softens",
          "14:22  TSLA  Q1 deliveries miss; guidance reiterated for FY26",
          "14:15  AAPL  India production share reaches 24% of iPhone output",
        ].map((l) => (
          <div key={l}>
            <span style={{ color: dim }}>&gt; </span>{l}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-8 border-t pt-2 text-[14px]" style={{ borderColor: dim }}>
        {["F1 HELP","F2 MENU","F3 EQUITY","F4 FI","F5 FX","F6 CMDTY","F7 NEWS","F8 PORT"].map((f) => (
          <span key={f} style={{ color: dim }}>{f}</span>
        ))}
      </div>
    </div>
  );
}
