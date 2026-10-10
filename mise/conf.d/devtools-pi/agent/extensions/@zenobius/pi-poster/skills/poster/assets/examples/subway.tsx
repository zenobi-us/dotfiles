
export default function SubwayMap() {
  const lines = [
    { id: 1, name: "Marunouchi", color: "#e11d48", code: "M" },
    { id: 2, name: "Ginza",      color: "#f59e0b", code: "G" },
    { id: 3, name: "Yamate",     color: "#10b981", code: "Y" },
    { id: 4, name: "Tozai",      color: "#0ea5e9", code: "T" },
    { id: 5, name: "Hibiya",     color: "#6366f1", code: "H" },
    { id: 6, name: "Oedo",       color: "#ec4899", code: "O" },
  ];

  type S = { x: number; y: number; name: string; lines: string[]; label?: "L"|"R"|"T"|"B" };
  const S: Record<string, S> = {
    m1: { x: 120,  y: 220, name: "Nerima",        lines: ["M"], label: "L" },
    m2: { x: 240,  y: 220, name: "Ikebukuro",     lines: ["M","Y"], label: "T" },
    m3: { x: 360,  y: 220, name: "Ochanomizu",    lines: ["M"],    label: "T" },
    m4: { x: 480,  y: 220, name: "Otemachi",      lines: ["M","T","H"], label: "T" },
    m5: { x: 600,  y: 220, name: "Ginza-Itchome", lines: ["M","G"], label: "T" },
    m6: { x: 720,  y: 340, name: "Shimbashi",     lines: ["M","Y","O"], label: "R" },
    m7: { x: 840,  y: 340, name: "Hamamatsucho",  lines: ["M"],    label: "R" },
    g1: { x: 600,  y: 100, name: "Asakusa",       lines: ["G"], label: "T" },
    g2: { x: 600,  y: 160, name: "Ueno",          lines: ["G","Y"], label: "L" },
    g3: { x: 540,  y: 280, name: "Ginza",         lines: ["G","H"], label: "L" },
    g4: { x: 540,  y: 400, name: "Roppongi",      lines: ["G","O"], label: "L" },
    g5: { x: 540,  y: 500, name: "Shibuya",       lines: ["G","Y"], label: "L" },
    y1: { x: 240,  y: 340, name: "Shinjuku",      lines: ["Y","T","O"], label: "L" },
    y4: { x: 720,  y: 500, name: "Tokyo",         lines: ["Y","H"], label: "R" },
    t1: { x: 120,  y: 400, name: "Nakano",        lines: ["T"], label: "L" },
    t3: { x: 360,  y: 400, name: "Kagurazaka",    lines: ["T"], label: "B" },
    t5: { x: 840,  y: 160, name: "Nishi-Funabashi", lines: ["T"], label: "R" },
    h1: { x: 300,  y: 540, name: "Naka-Meguro",   lines: ["H"], label: "B" },
    h3: { x: 420,  y: 340, name: "Hibiya",        lines: ["H","O"], label: "B" },
    h5: { x: 840,  y: 500, name: "Kita-Senju",    lines: ["H"], label: "R" },
    o1: { x: 120,  y: 500, name: "Hikarigaoka",   lines: ["O"], label: "L" },
    o_end: { x: 840, y: 400, name: "Daimon",      lines: ["O"], label: "R" },
  };

  type PT = { x: number; y: number };
  const resolve = (p: string | PT): PT => typeof p === "string" ? { x: S[p].x, y: S[p].y } : p;
  const paths: { id: string; color: string; pts: (string | PT)[] }[] = [
    { id: "M", color: lines[0].color, pts: ["m1","m2","m3","m4","m5","m6","m7"] },
    { id: "G", color: lines[1].color, pts: ["g1","g2", {x:600,y:220}, "m5","g3","g4","g5"] },
    { id: "Y", color: lines[2].color, pts: ["m2", {x:360, y:220}, "g2", {x:720, y:160}, "m6", "y4", {x:540, y:500}, "g5", {x:240, y:500}, "y1", "m2"] },
    { id: "T", color: lines[3].color, pts: ["t1","y1","t3","m4", {x:600,y:400}, {x:720,y:280}, "t5"] },
    { id: "H", color: lines[4].color, pts: ["h1", "g3", "h3","m4", {x:600,y:340}, "y4", "h5"] },
    { id: "O", color: lines[5].color, pts: ["o1", {x:240,y:500}, "y1", {x:360,y:340}, "h3", "g4", "m6", "o_end"] },
  ];

  const W = 960, H = 620;
  const poly = (pts: (string | PT)[]) => pts.map(p => { const q = resolve(p); return `${q.x},${q.y}`; }).join(" ");

  return (
    <div
      className="w-[1600px] p-10"
      style={{
        fontFamily: "Inter, sans-serif",
        background:
          "radial-gradient(900px 600px at 10% 0%, rgba(244,114,182,0.12), transparent 60%)," +
          "radial-gradient(900px 600px at 100% 100%, rgba(14,165,233,0.14), transparent 60%)," +
          "#0b0b12",
        color: "white",
      }}
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-white/50">
            Transit Authority · Schematic · Ed. VII
          </div>
          <div className="text-[56px] leading-[1.05] font-semibold tracking-tight mt-2">
            Shinkai Metro <span style={{ fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
              backgroundImage: "linear-gradient(180deg,#fef3c7,#f472b6,#a855f7)",
              WebkitBackgroundClip: "text", color: "transparent" }}>network</span>
          </div>
          <div className="text-white/60 text-[16px] mt-2">Six lines · 22 stations · 11 interchanges</div>
        </div>
        <div className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[14px] text-white/70 tabular-nums">
          Effective · 16 Apr 2026
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6"
        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 30px 60px -30px rgba(0,0,0,0.7)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#grid)"/>

          <g strokeLinejoin="round" strokeLinecap="round" fill="none">
            {paths.map((p) => (
              <polyline
                key={p.id}
                points={poly(p.pts)}
                stroke={p.color}
                strokeWidth={10}
                opacity={0.95}
                style={{ filter: `drop-shadow(0 0 8px ${p.color}55)` }}
              />
            ))}
          </g>

          {Object.entries(S).map(([k, s]) => {
            const isInt = s.lines.length > 1;
            const r = isInt ? 12 : 7;
            const lx = s.label === "L" ? s.x - r - 8 : s.label === "R" ? s.x + r + 8 : s.x;
            const ly = s.label === "T" ? s.y - r - 8 : s.label === "B" ? s.y + r + 16 : s.y + 4;
            const anchor = s.label === "L" ? "end" : s.label === "R" ? "start" : "middle";
            return (
              <g key={k}>
                <circle cx={s.x} cy={s.y} r={r + 3} fill="#0b0b12" />
                <circle cx={s.x} cy={s.y} r={r} fill={isInt ? "#ffffff" : "#0b0b12"}
                        stroke={isInt ? "#0b0b12" : "#ffffff"} strokeWidth={3}/>
                <text x={lx} y={ly} fill="white" fontSize={isInt ? 15 : 13}
                      fontWeight={isInt ? 700 : 500}
                      textAnchor={anchor as any}
                      style={{ paintOrder: "stroke", stroke: "#0b0b12", strokeWidth: 4 }}>
                  {s.name}
                </text>
              </g>
            );
          })}

          {paths.map((p, i) => {
            const first = resolve(p.pts[0]);
            const last = resolve(p.pts[p.pts.length - 1]);
            const L = lines[i];
            const endpoints = p.id === "Y" ? [] : [first, last];
            return endpoints.map((pt, j) => (
              <g key={`${p.id}-${j}`} transform={`translate(${pt.x + (j===0?-30:30)}, ${pt.y - 30})`}>
                <circle r="16" fill={L.color} stroke="white" strokeWidth="2.5"/>
                <text textAnchor="middle" y="6" fontSize="18" fontWeight="800" fill="white">{L.code}</text>
              </g>
            ));
          })}
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {lines.map((l) => (
          <div key={l.id}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)" }}>
            <div className="h-10 w-10 rounded-full grid place-items-center text-white font-extrabold text-[18px]"
                 style={{ background: l.color, boxShadow: `0 0 20px ${l.color}66` }}>
              {l.code}
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-semibold">{l.name} Line</div>
              <div className="text-white/50 text-[14px] tabular-nums">Route {String(l.id).padStart(2, "0")}</div>
            </div>
            <div className="h-2 w-16 rounded-full" style={{ background: l.color }}/>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-white/50 text-[14px] tabular-nums">
        <span>Schematic only · not drawn to scale · © Transit Authority</span>
        <span>◯ Interchange  ·  ● Local stop</span>
      </div>
    </div>
  );
}
