// Dev year-in-review — contribution heatmap + language mix + repos. 1600×1000.

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import {
  CodeIcon,
  FlameIcon,
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";

// ---------- data ----------

// 53 weeks × 7 days contribution heatmap
const heat = Array.from({ length: 53 }, (_, w) =>
  Array.from({ length: 7 }, () => {
    const r = Math.random();
    if (r < 0.35) return 0;
    if (r < 0.55) return 1;
    if (r < 0.78) return 2;
    if (r < 0.92) return 3;
    return 4;
  }),
);

const levelColor = [
  "rgba(255,255,255,0.05)",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
];

const langs = [
  { name: "TypeScript", value: 48, color: "#3178c6" },
  { name: "Python", value: 22, color: "#ffd54f" },
  { name: "Rust", value: 14, color: "#ff8a65" },
  { name: "Go", value: 9, color: "#00add8" },
  { name: "Swift", value: 5, color: "#f05138" },
  { name: "Other", value: 2, color: "#6b7280" },
];

const repos = [
  { name: "poster", desc: "tsx → html → png", stars: 1_842, commits: 284, lang: "TypeScript" },
  { name: "stage", desc: "agent runtime on Convex", stars: 962, commits: 411, lang: "TypeScript" },
  { name: "napkin", desc: "notes from the CLI", stars: 624, commits: 138, lang: "Rust" },
  { name: "pi", desc: "personal CLI zoo", stars: 388, commits: 602, lang: "TypeScript" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------- poster ----------

export default function DevWrap() {
  const total = heat.flat().reduce((a, b) => a + (b > 0 ? b * 2 : 0), 0);
  return (
    <div
      className="w-[1600px] px-10 py-10 text-white"
      style={{
        background:
          "radial-gradient(800px 500px at 90% 0%, rgba(57,211,83,0.12), transparent 60%), #0d1117",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      {/* header */}
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-[14px] uppercase tracking-[0.3em] text-white/50">
            <CodeIcon className="h-3.5 w-3.5" /> GitHub · 2025 in review
          </div>
          <h1 className="mt-2 text-5xl font-bold tracking-tight">
            @dev <span className="text-white/30">shipped</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[14px] uppercase tracking-wider text-white/50">
            Total contributions
          </div>
          <div className="font-sans text-5xl font-bold tabular-nums text-emerald-400">
            {total.toLocaleString()}
          </div>
        </div>
      </header>

      {/* top stats */}
      <div className="grid grid-cols-4 gap-4">
        <BigStat icon={GitCommitIcon} label="Commits" value="2,184" tone="#39d353" />
        <BigStat icon={GitPullRequestIcon} label="Pull requests" value="312" tone="#a371f7" />
        <BigStat icon={MessageSquareIcon} label="Reviews" value="486" tone="#f78166" />
        <BigStat icon={FlameIcon} label="Longest streak" value="42 days" tone="#ffa657" />
      </div>

      {/* contribution heatmap */}
      <div
        className="mt-4 rounded-2xl border border-white/[0.06] p-6"
        style={{ background: "#0d1117" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[14px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Activity graph
          </div>
          <div className="flex items-center gap-2 text-[14px] text-white/50">
            Less
            {levelColor.map((c, i) => (
              <span key={i} className="h-3 w-3 rounded-sm" style={{ background: c }} />
            ))}
            More
          </div>
        </div>
        <div className="flex gap-[3px]">
          {heat.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {week.map((level, d) => (
                <div
                  key={d}
                  className="h-[14px] w-[14px] rounded-sm"
                  style={{ background: levelColor[level] }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-[3px] text-[14px] text-white/40">
          {months.map((m) => (
            <span key={m} style={{ width: `${100 / 12}%` }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* languages + repos */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* languages donut */}
        <div
          className="col-span-4 rounded-2xl border border-white/[0.06] p-6"
          style={{ background: "#0d1117" }}
        >
          <div className="mb-3 text-[14px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Languages
          </div>
          <div className="flex items-center gap-4">
            <div className="h-[170px] w-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={langs}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {langs.map((l) => (
                      <Cell key={l.name} fill={l.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 text-[15px]">
              {langs.map((l) => (
                <div key={l.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  <span className="flex-1 text-white/80">{l.name}</span>
                  <span className="tabular-nums text-white/50">{l.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* top repos */}
        <div
          className="col-span-8 rounded-2xl border border-white/[0.06] p-6"
          style={{ background: "#0d1117" }}
        >
          <div className="mb-3 text-[14px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Top repositories
          </div>
          <div className="divide-y divide-white/[0.06]">
            {repos.map((r) => (
              <div key={r.name} className="flex items-center gap-4 py-2.5">
                <GitBranchIcon className="h-4 w-4 text-white/40" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-semibold text-sky-400">
                      dev/{r.name}
                    </span>
                    <span className="text-[14px] text-white/50">· {r.desc}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[14px] text-white/50">
                    <span className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            langs.find((l) => l.name === r.lang)?.color ?? "#6b7280",
                        }}
                      />
                      {r.lang}
                    </span>
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      {r.stars.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitCommitIcon className="h-3 w-3" />
                      {r.commits} commits
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(r.commits / 602) * 100}%`,
                      background:
                        langs.find((l) => l.name === r.lang)?.color ?? "#39d353",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof StarIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: "#0d1117" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold uppercase tracking-[0.2em] text-white/50">
          {label}
        </div>
        <Icon className="h-4 w-4" style={{ color: tone }} />
      </div>
      <div className="mt-2 font-sans text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
