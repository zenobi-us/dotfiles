---
name: poster
description: Render a standalone React component (Tailwind + Recharts + lucide-react) to PNG / SVG / PDF / JPG / WebP via the `poster_render` tool. Use when the user asks for a chart, dashboard, report card, social-share image, OG image, year-in-review, editorial data story, magazine layout, or any visual deliverable that should come out as a single image/document file. Not for interactive UIs; posters are compositions.
---

# poster

Render a single-file React component to an image. One tool: **`poster_render`**.

Write TSX like a graphic designer composes a poster, not like a web developer building a page. Everything is fixed-width, non-responsive, pixel-precise, and optimized to look **amazing at thumbnail size on a social feed**.

## When to reach for `poster_render`

Chart, dashboard snapshot, OG image, social-share card, year-in-review, editorial data story, magazine layout, event poster, calendar, cover image, PDF one-pager, README hero. Anything that's a *composition* meant to be looked at, not interacted with.

**Not** for: interactive UIs, forms, multi-page sites, anything needing runtime JS behavior after render.

---

## The contract

These aren't style preferences — break them and the tool rejects the render.

### 1. The root element declares the canvas — this is the only source of truth

**The tool has no `width` or `height` parameter.** The root <div>'s Tailwind size IS the canvas. The renderer measures it exactly.

```tsx
// ✓ width only — height emerges from content (use this 80% of the time)
<div className="w-[1600px] p-10 ...">

// ✓ width + height — fixed aspect for magazine covers, story format, etc.
<div className="w-[1080px] h-[1350px] p-10 ...">

// ✗ rejected — no root width (canvas defaults, usually wrong)
<div className="p-10 ...">

// ✗ rejected — min-h-screen stretches to viewport, not canvas
<div className="w-[1600px] min-h-screen ...">

// ✗ rejected — w-full next to w-[Npx] overrides the explicit width
<div className="w-[1600px] w-full ...">

// ✗ brittle — aspect without explicit width is indeterminate
<div className="aspect-[4/5] p-10 ...">
```

If you use absolute-positioned decorations (`top: 40%`, gradient blobs), you need a definite parent height — add `h-[Npx]` or `min-h-[Npx]` to the root.

### 2. Font-size floor: 14px

Anything ≤12px disappears when the poster is viewed at half scale on a feed. Don't go below `text-sm` (14px) or `text-[14px]`. Recharts axis ticks: `fontSize: 13`. Chart-internal SVG labels: `fontSize: 13+`.

### 3. Use the three bundled fonts

No imports needed. They're loaded in the shell:

- **`Inter, system-ui`** — default sans
- **`'Source Serif 4', serif`** — magazine / editorial / italic "reveal words"
- **`'JetBrains Mono', ui-monospace, monospace`** — code, mono metadata

Set via inline `style={{ fontFamily: "..." }}` on the root.

### 4. Canvas size by shape

| shape | width | height | use |
|---|---|---|---|
| twitter / landscape | 1600 | auto or 900 | thread images, cover images |
| OG image | 1200 | 630 | social previews (1.91:1) |
| instagram square | 1200 | 1200 | social square |
| story / wrapped | 1080 | 1350 | vertical, mobile-first |
| editorial / magazine | 1400 | 1800 | tall data story |
| dashboard | 1600 | 1000 | metrics grid |
| poster / cover | 1200 | 1600 | print-feel |
| weather / hero card | 1400 | 900 | glass-card compositions |

Pick a shape, write `w-[Npx]` (add `h-[Npx]` only if fixed-aspect), let auto-fit do the rest.

---

## The layout grammar

Every good poster uses these primitives. Mix and match.

### Header row: kicker + title (left) + chip (right)

```tsx
<header className="flex items-end justify-between">
  <div>
    <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-white/50">
      Pi · Monday, 16 April 2026
    </div>
    <h1 className="mt-2 text-5xl font-black tracking-tight">
      Good morning
    </h1>
  </div>
  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[14px] text-white/60">
    Live · last 7 days
  </div>
</header>
```

Rule of thumb: **kicker = meta context, title = the answer, right-side chip = status/time**.

### Eyebrow kicker (the "small-caps label")

```tsx
<div className="text-[14px] font-bold uppercase tracking-[0.3em] text-white/50">
  FIG. 1 — GLOBAL TEMPERATURE ANOMALY
</div>
```

- `text-[14px]` to `text-[15px]`
- `font-semibold` to `font-bold`
- `uppercase` always
- `tracking-[0.2em]` to `tracking-[0.5em]`  — more tracking = more formal
- muted color: `text-white/40` to `text-white/60` on dark, `text-neutral-500` on light

### Italic "reveal word" in a headline

The signature move. Break a headline with a gradient-filled Source Serif 4 italic:

```tsx
<h1 className="text-7xl font-black tracking-tight leading-[0.9]">
  A century and a half of{" "}
  <em
    className="italic font-normal"
    style={{
      fontFamily: "'Source Serif 4', serif",
      background: "linear-gradient(180deg,#fef3c7 0%,#f472b6 55%,#a855f7 100%)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    }}
  >
    warming,
  </em>{" "}
  charted in one line.
</h1>
```

The pastel-to-fuchsia-to-violet gradient is the most reusable "poster-ai look". Other good ones:
- `#fef3c7 → #f97316 → #dc2626` (cream → orange → crimson)
- `#22d3ee → #8b5cf6` (cyan → violet)
- `#fde68a → #f59e0b → #ec4899` (butter → amber → pink)

### Card (the workhorse container)

```tsx
<div
  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
  style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 40px -24px rgba(0,0,0,0.6)" }}
>
  {children}
</div>
```

- `rounded-xl` (12px) to `rounded-3xl` (24px)
- subtle border: `border-white/[0.05-0.15]` on dark, `border-neutral-200/80` on light
- subtle fill: `bg-white/[0.02-0.08]` on dark, pure `bg-white` on light
- inset top highlight + offset shadow for floating feel

### KPI stat

```tsx
<div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
  <div className="flex items-center justify-between">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
         style={{ background: "linear-gradient(135deg,#22d3ee,#3b82f6)" }}>
      <TrendingUpIcon className="h-4 w-4 text-white" />
    </div>
    <span className="text-[14px] font-medium text-emerald-400">+18.4%</span>
  </div>
  <div className="mt-4 text-[14px] uppercase tracking-wider text-white/40">ARR</div>
  <div className="mt-1 text-2xl font-semibold tabular-nums">$14.8M</div>
</div>
```

Gradient icon square + label + value + delta chip. Use `tabular-nums` on every number.

### Hero metric (the big single number)

```tsx
<div>
  <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-white/80">
    You listened to
  </div>
  <div className="mt-2 font-black leading-[0.82] tracking-tighter tabular-nums"
       style={{ fontSize: 220 }}>
    586
  </div>
  <div className="mt-1 text-3xl font-bold">hours of music</div>
  <div className="mt-1 text-lg text-white/80">
    That's longer than 83% of listeners in Portugal.
  </div>
</div>
```

Kicker → ENORMOUS number (180-260px) → unit → context sentence. Set `fontSize` inline when going above `text-9xl`.

### Activity ring (Apple-Watch style)

```tsx
const stroke = 18, r = (200 - stroke) / 2, c = 2 * Math.PI * r;
const pct = Math.min(value / goal, 1.4);
<svg width={200} height={200} className="-rotate-90">
  <circle cx={100} cy={100} r={r} stroke={color} strokeOpacity={0.15}
          strokeWidth={stroke} fill="none" />
  <circle cx={100} cy={100} r={r} stroke={color} strokeWidth={stroke}
          strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 8px ${color}99)` }} />
</svg>
```

### Contribution heatmap (GitHub-style)

```tsx
const levelColor = ["rgba(255,255,255,0.05)", "#0e4429", "#006d32", "#26a641", "#39d353"];
<div className="flex gap-[3px]">
  {weeks.map((week, w) => (
    <div key={w} className="flex flex-col gap-[3px]">
      {week.map((level, d) => (
        <div key={d} className="h-[14px] w-[14px] rounded-sm"
             style={{ background: levelColor[level] }} />
      ))}
    </div>
  ))}
</div>
```

### Footer

```tsx
<footer className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-[14px] text-white/30">
  <span>poster · generated 2026-04-16</span>
  <span>nebula.dev/pulse</span>
</footer>
```

---

## Color systems

Pick ONE family and stick to it. Mixing accents = muddy.

### Dark theme bases

| color | use |
|---|---|
| `#05050a` | black with fuchsia cast |
| `#07060d` / `#0b0a12` | black with violet cast |
| `#0a0a0f` | neutral near-black |
| `#0d1117` | GitHub black |
| `#07080c` | blue-black |

### Light theme bases

| color | use |
|---|---|
| `#fafaf7` | editorial off-white |
| `#faf5ed` | warm paper |
| `#f5e8de` | magazine cream |
| `#fef08a` | brutalist yellow |
| `#fef3c7` | pastel cream |

### Accent families (pick one)

| family | swatches | vibe |
|---|---|---|
| **cyan/violet** | `#22d3ee`, `#3b82f6`, `#a78bfa`, `#7c3aed` | tech, analytics, premium |
| **amber/rose** | `#fbbf24`, `#f97316`, `#fb7185`, `#e11d48` | warm, retail, alerts |
| **emerald** | `#10b981`, `#34d399`, `#39d353` | growth, health, positive |
| **fuchsia/violet** | `#ec4899`, `#f472b6`, `#a855f7`, `#6d28d9` | consumer, energy, wrapped |

### Gradient recipes

```ts
// Radial "hotspot" — use two at opposite corners for depth
"radial-gradient(800px 500px at 90% 0%, rgba(139,92,246,0.18), transparent 60%), #0a0a0f"

// Pastel reveal gradient (for gradient text)
"linear-gradient(180deg,#fef3c7 0%,#f472b6 55%,#a855f7 100%)"

// Tech gradient (for icon squares)
"linear-gradient(135deg,#22d3ee,#3b82f6)"

// Sunset (for story backgrounds)
"radial-gradient(ellipse at top, #7c3aed 0%, #ec4899 40%, #f97316 75%, #fbbf24 100%)"
```

### Grain overlay (adds poster-print feel)

```tsx
<div
  className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
  style={{
    backgroundImage: "repeating-radial-gradient(circle at 20% 30%, white 0, white 1px, transparent 1px, transparent 4px)",
  }}
/>
```

---

## Recharts idioms

Posters use Recharts differently than an app does. No tooltips (static render), no legend chrome, minimal axes, gradient fills.

### Always

- Wrap in `<ResponsiveContainer width="100%" height="100%">` inside a fixed-height parent
- `tickLine={false} axisLine={false}` on axes
- Tick styles: `tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 13 }}`
- `CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}` (horizontal-only grid)

### Gradient fills

```tsx
<defs>
  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
  </linearGradient>
</defs>
<Area dataKey="v" stroke="#22d3ee" strokeWidth={2} fill="url(#g1)" />
```

### Compare vs forecast pattern

Dashed forecast line + solid actual, both filled:

```tsx
<Area dataKey="forecast" stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1.5} fill="url(#fill-fc)" />
<Area dataKey="revenue" stroke="#22d3ee" strokeWidth={2.5} fill="url(#fill-rev)" />
```

### Bar charts

- `radius={[6, 6, 0, 0]}` on the Bar for rounded tops
- Per-bar color via `<Cell>` inside `<Bar>`
- Hide one axis when values speak for themselves: `<YAxis hide />`

### Donut / radial

- `innerRadius={38} outerRadius={62}` for thin ring
- `paddingAngle={2}` for gap between slices
- `stroke="none"` to remove outlines
- Color slices via `<Cell fill={...}>` mapped from data

---

## Content voice — realistic, not `foo`/`bar`

Use plausible fake data. It makes the poster feel real, which makes it persuasive.

- **Names**: diverse origins — Ava Chen, Sora Okafor, Elena Rossi, Kai Nakamura, Jin Park, Lior Mendez, Anaïs Okafor
- **Revenue**: `$48,291`, `$14.8M`, `+12.4%` — precise, never round
- **Dates**: "Monday, 16 April 2026", "Apr 16 · Tuesday", "Spring 2026"
- **Places**: Lisbon, Berlin, Tokyo, Estrela, Tanzhaus Alpha
- **Product/publication names**: Prism, Nebula, The Almanac, MUSE, Vol. XII
- **Numbers with deltas**: pair every metric with "+N% vs last week"
- **Handles**: `@dev`, `@you`, `@team` — never personal names like @alice

### Three-part kickers

"Publication · Volume · Category" feels authoritative:

```
The Almanac · Vol. XII · Climate
Pi · Monday, 16 April 2026
Live at Tanzhaus · Berlin
POSTER · SHOWCASE
```

---

## Visual effects

Small touches that separate "a poster" from "a webpage screenshot".

### Floating card shadow

```css
boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 40px -24px rgba(0,0,0,0.6)"
```

Inner edge highlight + outer offset shadow. Makes cards feel lifted.

### Icon glow

```css
filter: `drop-shadow(0 0 8px ${color}99)`
```

On activity rings, gradient circles, accent dots.

### Backdrop blur glass

```tsx
<div className="rounded-3xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl p-10">
```

On colorful gradient backgrounds. Weather hero, fitness cards.

### Barcode / mono chrome

```tsx
{Array.from({ length: 32 }).map((_, i) => (
  <div key={i} style={{ width: i % 3 === 0 ? 2 : 1, height: 40, background: "white" }} />
))}
```

Magazine-cover barcode strip. Feels editorial.

### Generative radial scatter

```tsx
{Array.from({ length: 320 }).map((_, i) => {
  const ring = Math.floor(i / 64);
  const angle = ((i % 64) / 64) * Math.PI * 2;
  const radius = 40 + ring * 55 + Math.sin(i * 0.8) * 14;
  const hue = ((ring / 5) * 300 + 180) % 360;
  return (
    <circle cx={Math.cos(angle) * radius} cy={Math.sin(angle) * radius}
            r={1 + Math.abs(Math.sin(i * 0.7)) * 4}
            fill={`hsl(${hue},80%,62%)`} opacity={0.82} />
  );
})}
```

Great for hero visuals where the poster is about the *shape* of data.

---

## Compositions catalog

Reach for one of these skeletons based on what the user wants.

### Dashboard (4-up KPI row + mixed chart grid)

1. Header (good-morning + systems chip)
2. 4 × KPI card row
3. 2-col: wide area chart + narrow activity list
4. 2-col: bar chart + donut

See: `dashboard` example vibe.

### Editorial data story (magazine)

1. Masthead strip (publication · vol · issue)
2. Big headline with serif italic reveal word + lede paragraph
3. Fig. 1: wide chart with caption
4. Two-column: chart + chart
5. Pull quote with serif italic + left border
6. Footer (url + page N)

### Year-in-review (story format 1080×1350)

1. Tiny header (app name + @user chip)
2. HERO number (200px+)
3. Top-N list with gradient progress bars
4. Monthly rhythm bar chart
5. "Most played X" featured card with gradient icon
6. Hashtag footer

### Fitness / health dashboard

1. Date kicker + encouragement headline
2. 2-up: activity rings card | 6-stat grid card
3. 2-up: wide heart-rate area chart | weekly bars

### Social share card / OG

1. Single hero element (giant word, gradient number, icon)
2. Kicker above, url/handle below
3. Dark background with 2 radial gradient hotspots
4. 1600×900

### Event / concert poster

1. Mono-spaced corner metadata
2. THREE STACKED WORDS, alternating treatments (gradient / italic / outline-only)
3. Divider strip with date + status
4. 2-col: lineup list + info cards
5. Genre tag chips at bottom

### Weather hero

1. Painted-sky gradient root (`linear-gradient(160deg, #f0abfc, #818cf8, #22d3ee, #0ea5e9)`)
2. Glass backdrop-blur card containing:
   - Location kicker + chip
   - MASSIVE temperature (180px+) with degree symbol
   - Row of icon+stat (humidity, wind, UV)
   - 24-hour area chart with data labels
   - 7-day forecast row with icon + hi/lo per day

---

## Pitfalls — how posters go wrong

| symptom | cause | fix |
|---|---|---|
| Content is way too tall | `min-h-screen` on root | use `w-[Npx]`, no min-h-screen |
| Empty colored strip at bottom | forced `h-[Npx]` bigger than content | drop the height, let it auto |
| Content overflows canvas right | stray `w-full` next to `w-[Npx]` | delete `w-full` |
| Labels illegible in preview | `text-xs` / `text-[11px]` | floor is 14px |
| Absolute shapes in wrong place | root has no definite height | add `min-h-[Npx]` |
| **Bars / elements with `height: X%` render invisible** | **parent has no fixed height — percentage resolves to 0** | **use pixel math: `height: ${(v/max)*80}px`** |
| **Content at bottom of fixed-aspect poster is missing** | **content overflows `h-[Npx]` and root has `overflow-hidden`** | **drop `h-[Npx]` (let height be content-driven), or reduce content** |
| "Muddy" color feel | mixed 3+ accent families | pick one family |
| "Generic webpage" feel | no kicker/footer rhythm | add small-caps eyebrows + muted footer |

### Fixed-aspect posters need to budget content to the canvas

When you declare `w-[1080px] h-[1350px]`, any content that extends past 1350px gets clipped (root usually has `overflow-hidden` to contain gradient blobs). Before writing the TSX, mentally add up section heights:

```
padding (p-14 = 56px × 2)  = 112
header block               ~180
hero number card           ~320
stats row                  ~120
authors card               ~320
rhythm card                ~160
footer                     ~60
                           ----
                           ~1272  → fits in 1350 with ~80px breathing
```

If the budget is tight, either drop a section or switch to content-driven height (just `w-[Npx]`). The `wrapped` example does this — width fixed at 1080, height emerges.

### Bar charts / histograms without Recharts

If you're drawing bars by hand (not via Recharts), use **pixel math** for the bar heights, not percentages:

```tsx
// ✗ collapses to 0 if parent is content-driven
<div style={{ height: `${(v / max) * 100}%` }} />

// ✓ explicit pixel ceiling, works everywhere
<div style={{ height: `${(v / max) * 80}px` }} />
```

Or constrain the parent to a fixed pixel height (`h-[120px]`) and put the bar inside with `h-full` / absolute positioning.

---

## Calling the tool

```
poster_render({
  tsx: "<your full TSX source as a string>",
  out: "./chart.png"
})
```

That's it. No `width` or `height` — the TSX root's Tailwind size is the canvas. Format is inferred from the extension (`.png`, `.svg`, `.pdf`, `.jpg`, `.webp`).

The tool returns the resolved absolute path, the rendered pixel dimensions (so you can sanity-check), size in KB, and format. Surface that to the user so they know where the file landed.

---

## A minimal working example

```tsx
export default function Hello() {
  return (
    <div
      className="w-[1200px] p-12 text-white"
      style={{
        background:
          "radial-gradient(800px 500px at 90% -10%, rgba(168,85,247,0.2), transparent 60%), #07060d",
        fontFamily: "'Inter', system-ui",
      }}
    >
      <div className="text-[14px] font-bold uppercase tracking-[0.4em] text-white/40">
        Pi · 16 Apr 2026
      </div>
      <h1 className="mt-3 text-6xl font-black tracking-tight leading-tight">
        Hello,{" "}
        <span
          className="italic font-normal"
          style={{
            fontFamily: "'Source Serif 4', serif",
            background: "linear-gradient(180deg,#fef3c7 0%,#f472b6 55%,#a855f7 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          world.
        </span>
      </h1>
      <div className="mt-4 text-sm text-white/50">
        A one-minute poster. Made with poster-ai.
      </div>
    </div>
  );
}
```

Always start with a skeleton this shape: gradient root + kicker + headline (with one italic reveal word) + supporting line. Add complexity from there.
