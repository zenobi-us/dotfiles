import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  Circle,
} from "lucide-react";

// ---------- data ----------
const revenueSeries = [
  { d: "Mon", v: 2400, prev: 1800 },
  { d: "Tue", v: 3100, prev: 2200 },
  { d: "Wed", v: 2800, prev: 2600 },
  { d: "Thu", v: 4200, prev: 3100 },
  { d: "Fri", v: 3900, prev: 3500 },
  { d: "Sat", v: 5100, prev: 4000 },
  { d: "Sun", v: 4700, prev: 4200 },
];

const channels = [
  { name: "Organic", v: 4200 },
  { name: "Direct", v: 3100 },
  { name: "Paid", v: 2400 },
  { name: "Social", v: 1800 },
  { name: "Referral", v: 900 },
];

const segments = [
  { name: "Pro", v: 48, color: "#6366f1" },
  { name: "Team", v: 28, color: "#10b981" },
  { name: "Starter", v: 18, color: "#f59e0b" },
  { name: "Free", v: 6, color: "#e5e7eb" },
];

const activity = [
  { name: "Ava Chen", action: "upgraded to Pro", time: "2m", amount: "+$49" },
  { name: "Sora Okafor", action: "renewed annual plan", time: "21m", amount: "+$588" },
  { name: "Jin Park", action: "cancelled subscription", time: "44m", amount: "-$29" },
  { name: "Elena Rossi", action: "upgraded to Team", time: "1h", amount: "+$199" },
  { name: "Kai Nakamura", action: "added 3 seats", time: "2h", amount: "+$87" },
];

// ---------- primitives ----------
function KPI({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: any;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[14px] font-medium text-neutral-500 uppercase tracking-wider">{label}</div>
          <div className="text-[26px] font-semibold tracking-tight text-neutral-900 mt-1.5">{value}</div>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon size={19} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <div
          className={`flex items-center gap-0.5 text-sm font-medium ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta}
        </div>
        <div className="text-sm text-neutral-400">vs last week</div>
      </div>
    </div>
  );
}

// ---------- dashboard ----------
export default function Dashboard() {
  return (
    <div className="w-[1600px] bg-neutral-50 text-neutral-900 p-8 flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 shrink-0" />
          <div>
            <div className="text-sm text-neutral-500">Prism · Monday, 16 April 2026</div>
            <h1 className="text-2xl font-semibold tracking-tight leading-tight">Good morning</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm bg-white border border-neutral-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Circle size={7} className="fill-emerald-500 text-emerald-500" />
            All systems healthy
          </div>
          <div className="text-sm bg-neutral-900 text-white rounded-lg px-3 py-1.5 font-medium">Last 7 days</div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Revenue" value="$48,291" delta="+12.4%" positive icon={DollarSign} accent="#6366f1" />
        <KPI label="Active users" value="3,482" delta="+8.1%" positive icon={Users} accent="#10b981" />
        <KPI label="Orders" value="1,247" delta="+21.8%" positive icon={ShoppingCart} accent="#f59e0b" />
        <KPI label="Churn" value="2.1%" delta="-0.4%" positive icon={Activity} accent="#ef4444" />
      </div>

      {/* Main row: revenue chart (wide) + activity (narrow) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-neutral-900">Revenue</div>
              <div className="text-sm text-neutral-500 mt-0.5">Daily gross revenue, last 7 days</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-neutral-700">This week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-300" />
                <span className="text-neutral-500">Last week</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <AreaChart width={820} height={220} data={revenueSeries}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="d" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} />
              <Area type="monotone" dataKey="prev" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" fill="transparent" dot={false} />
              <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} fill="url(#g1)" dot={false} />
            </AreaChart>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Recent activity</div>
              <div className="text-sm text-neutral-500 mt-0.5">Last 2 hours</div>
            </div>
            <ArrowUpRight size={14} className="text-neutral-400" />
          </div>
          <div className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center text-[14px] font-semibold text-neutral-600 shrink-0">
                  {a.name.split(" ").map((p) => p[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-900 truncate">
                    <span className="font-medium">{a.name}</span>{" "}
                    <span className="text-neutral-500">{a.action}</span>
                  </div>
                  <div className="text-[14px] text-neutral-400">{a.time} ago</div>
                </div>
                {a.amount && (
                  <div
                    className={`text-sm font-medium ${
                      a.amount.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {a.amount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Channels bar + Plan mix donut */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Channels</div>
              <div className="text-sm text-neutral-500 mt-0.5">Traffic source breakdown</div>
            </div>
          </div>
          <BarChart width={520} height={140} data={channels} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={13} tickLine={false} axisLine={false} width={70} />
            <Bar dataKey="v" fill="#6366f1" radius={[4, 4, 4, 4]} />
          </BarChart>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Plan mix</div>
              <div className="text-sm text-neutral-500 mt-0.5">Share of active subscriptions</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <PieChart width={130} height={130}>
              <Pie data={segments} dataKey="v" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                {segments.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {segments.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-neutral-700">{s.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900">{s.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
