export default function Cover() {
  return (
    <div
      className="w-[1200px] h-[1200px] relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", background: "#d9cfbb" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1400px 900px at 70% 30%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(900px 700px at 10% 90%, rgba(0,0,0,0.08), transparent 60%)",
        }}
      />
      <div className="absolute top-[44px] left-[64px] right-[64px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full" style={{ background: "#1a2f4a" }} />
          <div className="text-[18px] font-black tracking-[0.32em]" style={{ color: "#1a2f4a" }}>
            BLUE NOTE
          </div>
        </div>
        <div className="text-[14px] font-bold tracking-[0.35em]" style={{ color: "#1a2f4a" }}>
          BLP 4187 · STEREO
        </div>
      </div>

      <svg className="absolute" style={{ left: 110, top: 170, width: 980, height: 720 }} viewBox="0 0 980 720">
        <defs>
          <linearGradient id="horn" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a5f7d" />
            <stop offset="55%" stopColor="#1f3d5c" />
            <stop offset="100%" stopColor="#0f2236" />
          </linearGradient>
          <linearGradient id="bell" x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0%" stopColor="#c9a86a" />
            <stop offset="100%" stopColor="#7a5a2a" />
          </linearGradient>
        </defs>
        <path
          d="M 120 520 C 120 300, 280 150, 520 160 C 720 170, 820 300, 820 420 C 820 520, 740 580, 640 580 C 560 580, 520 540, 520 480 C 520 430, 560 400, 610 400 L 760 400"
          fill="none" stroke="url(#horn)" strokeWidth="68" strokeLinecap="round"
        />
        <ellipse cx="840" cy="400" rx="120" ry="150" fill="url(#bell)" transform="rotate(18 840 400)" />
        <ellipse cx="840" cy="400" rx="82" ry="110" fill="#0f2236" transform="rotate(18 840 400)" />
        <path d="M 60 640 C 240 560, 420 600, 600 660" fill="none" stroke="#b85c3a" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={280 + i * 70} cy={340 + i * 18} r="10" fill="#c9a86a" />
        ))}
      </svg>

      <div className="absolute left-[64px] bottom-[230px]">
        <div className="text-[22px] font-bold tracking-[0.4em] mb-3" style={{ color: "#b85c3a" }}>
          JOSHUA MBEKI QUARTET
        </div>
        <div className="leading-[0.92]" style={{ color: "#0f2236" }}>
          <div className="text-[128px] font-black tracking-[-0.03em]">Midnight</div>
          <div className="text-[92px] font-light italic tracking-[-0.01em] -mt-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
            in Roppongi
          </div>
        </div>
      </div>

      <div className="absolute left-[64px] right-[64px] bottom-[64px] flex items-end justify-between">
        <div className="text-[15px] font-bold tracking-[0.22em] leading-[1.7]" style={{ color: "#1a2f4a" }}>
          <div>JOSHUA MBEKI — TENOR SAXOPHONE</div>
          <div>HIROSHI TANAKA — PIANO</div>
          <div>WALTER BRIDGES — BASS</div>
          <div>ART PEMBERTON — DRUMS</div>
        </div>
        <div className="text-right text-[14px] font-bold tracking-[0.3em] leading-[1.9]" style={{ color: "#1a2f4a" }}>
          <div>RECORDED AT</div>
          <div>VAN GELDER STUDIO</div>
          <div>NOV. 14, 1962</div>
        </div>
      </div>
    </div>
  );
}
