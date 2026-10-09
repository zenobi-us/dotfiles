// Editorial data-story — magazine typography + inline viz. 1400×1800 (tall).

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// ---------- data ----------

const temp = Array.from({ length: 144 }, (_, i) => ({
  y: 1880 + i,
  t: -0.2 + i * 0.011 + Math.sin(i * 0.3) * 0.08 + Math.random() * 0.04,
}));

const emitters = [
  { country: "China", pct: 31, color: "#111" },
  { country: "United States", pct: 14, color: "#333" },
  { country: "India", pct: 7.6, color: "#555" },
  { country: "Russia", pct: 4.8, color: "#777" },
  { country: "Japan", pct: 3.1, color: "#999" },
  { country: "Rest of world", pct: 39.5, color: "#c8c8c8" },
];

const sectors = [
  { s: "Energy", v: 73 },
  { s: "Agriculture", v: 12 },
  { s: "Industry", v: 6 },
  { s: "Waste", v: 3 },
  { s: "Land use", v: 6 },
];

// ---------- poster ----------

export default function Editorial() {
  return (
    <div
      className="w-[1400px] bg-[#fafaf7] px-16 py-14 text-neutral-900"
      style={{ fontFamily: '"Source Serif 4", "Georgia", serif' }}
    >
      {/* masthead */}
      <div className="mb-10 flex items-end justify-between border-b-2 border-black pb-4">
        <div className="text-[15px] font-semibold uppercase tracking-[0.35em]">
          The Almanac · Vol. XII · Climate
        </div>
        <div className="text-[15px] uppercase tracking-wider text-neutral-500">
          Issue 04 — Spring 2026
        </div>
      </div>

      {/* headline */}
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-8">
          <h1 className="font-serif text-7xl font-semibold leading-[0.95] tracking-tight">
            A century and a half of <em className="font-light italic">warming</em>,
            charted in one line.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-neutral-700">
            Global mean surface temperature has risen more than 1.2°C since 1880.
            The curve below tracks deviation from the 1951–1980 baseline.
            The last decade contains nine of the ten hottest years ever recorded.
          </p>
        </div>
        <div className="col-span-4 flex flex-col justify-end">
          <div className="text-[14px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
            By the numbers
          </div>
          <div className="mt-3 space-y-4 border-l-2 border-black pl-4">
            <Big value="+1.28°C" label="vs pre-industrial, 2024" />
            <Big value="420 ppm" label="atmospheric CO₂, 2024" />
            <Big value="1.5°C" label="Paris Agreement target" />
          </div>
        </div>
      </div>

      {/* main chart */}
      <figure className="mt-10">
        <div className="text-[14px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Fig. 1 — Global temperature anomaly, 1880–2023
        </div>
        <div className="mt-2 h-[340px] border-b-2 border-t border-black">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={temp} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ed-pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="y"
                tick={{ fill: "#525252", fontSize: 13, fontFamily: "Georgia" }}
                tickLine={false}
                axisLine={false}
                interval={23}
              />
              <YAxis
                tick={{ fill: "#525252", fontSize: 13, fontFamily: "Georgia" }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}°C`}
              />
              <Area
                type="monotone"
                dataKey="t"
                stroke="#e11d48"
                strokeWidth={2}
                fill="url(#ed-pos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="mt-2 text-[14px] italic text-neutral-500">
          Source: NASA GISS surface-temperature analysis.
        </figcaption>
      </figure>

      {/* two-column section */}
      <div className="mt-14 grid grid-cols-12 gap-10">
        <div className="col-span-7">
          <div className="text-[14px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Fig. 2 — Share of global emissions, 2023
          </div>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Five countries account for two-thirds of everything.
          </h2>
          <div className="mt-4">
            <div className="flex h-10 w-full overflow-hidden rounded-sm">
              {emitters.map((e) => (
                <div
                  key={e.country}
                  style={{ width: `${e.pct}%`, background: e.color }}
                  className="first:rounded-l-sm last:rounded-r-sm"
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[16px]">
              {emitters.map((e) => (
                <div key={e.country} className="flex items-center gap-2 border-b border-neutral-200 py-1">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ background: e.color }}
                  />
                  <span className="flex-1">{e.country}</span>
                  <span className="font-semibold tabular-nums">{e.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="text-[14px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Fig. 3 — Emissions by sector
          </div>
          <h2 className="mt-2 font-serif text-3xl font-semibold">
            Energy dominates.
          </h2>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectors}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="s"
                  tick={{ fill: "#111", fontSize: 13, fontFamily: "Georgia" }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Bar dataKey="v" fill="#111" radius={[0, 2, 2, 0]}>
                  {sectors.map((d) => (
                    <Cell key={d.s} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* pullquote */}
      <blockquote className="mt-14 border-l-4 border-black pl-8">
        <p className="font-serif text-4xl font-light italic leading-snug">
          "The science is unambiguous. What remains is whether we intend to act
          at the scale the problem demands — not whether we are able to."
        </p>
        <footer className="mt-3 text-[15px] uppercase tracking-[0.25em] text-neutral-500">
          — IPCC AR6 Synthesis, paraphrased
        </footer>
      </blockquote>

      {/* footer */}
      <div className="mt-12 flex items-center justify-between border-t-2 border-black pt-4 text-[14px] uppercase tracking-[0.25em] text-neutral-500">
        <span>the-almanac.org</span>
        <span>Page 14 / 68</span>
      </div>
    </div>
  );
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-[14px] uppercase tracking-wider text-neutral-500">
        {label}
      </div>
    </div>
  );
}
