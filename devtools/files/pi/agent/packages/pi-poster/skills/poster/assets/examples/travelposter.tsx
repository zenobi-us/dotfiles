export default function Poster() {
  const cream = "#f1e6cc";
  const navy = "#1b2a3a";
  const teal = "#2d6a6a";
  const orange = "#c7502a";
  const ink = "#14202c";

  return (
    <div
      className="w-[1200px] h-[1700px] relative overflow-hidden"
      style={{
        backgroundColor: cream,
        backgroundImage:
          "radial-gradient(1200px 800px at 20% 10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(800px 600px at 90% 90%, rgba(0,0,0,0.08), transparent 60%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* subtle paper grain via layered noise-like dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,32,44,0.05) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          mixBlendMode: "multiply",
        }}
      />

      {/* outer border frame */}
      <div
        className="absolute"
        style={{
          top: 40, left: 40, right: 40, bottom: 40,
          border: `3px solid ${ink}`,
        }}
      />
      <div
        className="absolute"
        style={{
          top: 54, left: 54, right: 54, bottom: 54,
          border: `1px solid ${ink}`,
        }}
      />

      {/* Top kicker */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-6"
        style={{ top: 96, color: ink }}
      >
        <span style={{ height: 1, width: 120, background: ink }} />
        <span
          className="uppercase"
          style={{
            fontFamily: "'Source Serif 4', serif",
            letterSpacing: "0.5em",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Visit · MCMXXXVI
        </span>
        <span style={{ height: 1, width: 120, background: ink }} />
      </div>

      {/* Main illustration SVG */}
      <svg
        viewBox="0 0 1000 1100"
        className="absolute"
        style={{ top: 150, left: 100, width: 1000, height: 1100 }}
      >
        <defs>
          <clipPath id="frame">
            <rect x="0" y="0" width="1000" height="1100" />
          </clipPath>
        </defs>

        <g clipPath="url(#frame)">
          {/* Sky */}
          <rect x="0" y="0" width="1000" height="700" fill={navy} />

          {/* Aurora ribbons — flat geometric bands */}
          <g opacity="0.95">
            <path
              d="M-20 180 Q 200 60 420 200 T 1020 180 L 1020 260 Q 800 140 500 280 T -20 260 Z"
              fill={teal}
              opacity="0.85"
            />
            <path
              d="M-20 260 Q 220 140 460 280 T 1020 260 L 1020 330 Q 780 220 500 360 T -20 340 Z"
              fill={orange}
              opacity="0.75"
            />
            <path
              d="M-20 340 Q 260 220 500 360 T 1020 340 L 1020 400 Q 760 300 520 420 T -20 400 Z"
              fill={cream}
              opacity="0.55"
            />
          </g>

          {/* Moon */}
          <circle cx="780" cy="160" r="46" fill={cream} opacity="0.9" />
          <circle cx="796" cy="150" r="46" fill={navy} />

          {/* Stars */}
          {[
            [80, 80], [180, 140], [300, 60], [420, 120], [600, 70],
            [900, 120], [950, 60], [120, 220], [260, 180], [860, 240],
          ].map(([x, y], i) => (
            <g key={i} fill={cream} opacity="0.85">
              <circle cx={x} cy={y} r={i % 3 === 0 ? 2.5 : 1.5} />
            </g>
          ))}

          {/* Distant mountain layer */}
          <polygon
            points="0,560 120,440 240,520 380,400 520,500 660,420 820,510 1000,430 1000,700 0,700"
            fill={teal}
          />

          {/* Snow caps distant */}
          <polygon points="120,440 95,475 150,475" fill={cream} opacity="0.9" />
          <polygon points="380,400 345,445 420,445" fill={cream} opacity="0.9" />
          <polygon points="660,420 628,462 700,462" fill={cream} opacity="0.9" />
          <polygon points="1000,430 960,475 1000,475" fill={cream} opacity="0.9" />

          {/* Mid volcano with lava */}
          <polygon
            points="280,700 500,300 720,700"
            fill={ink}
          />
          <polygon
            points="500,300 470,360 520,355 495,420 540,400 515,480 560,455 530,540 575,520 545,600 590,580 560,660 610,645 585,700 720,700 500,300"
            fill={orange}
            opacity="0.0"
          />
          {/* lava streak */}
          <path
            d="M500 300 L 488 360 L 512 360 L 498 430 L 522 420 L 506 500 L 534 480 L 515 560 L 548 540 L 525 630 L 560 615 L 540 700 L 600 700 Z"
            fill={orange}
          />
          {/* Snow cap on volcano */}
          <polygon
            points="500,300 460,370 540,370"
            fill={cream}
          />
          <polygon
            points="460,370 475,385 500,372 525,385 540,370 530,390 505,378 480,390"
            fill={cream}
          />

          {/* Smoke plume — stepped deco */}
          <g fill={cream} opacity="0.85">
            <ellipse cx="500" cy="270" rx="55" ry="22" />
            <ellipse cx="478" cy="230" rx="45" ry="18" />
            <ellipse cx="520" cy="195" rx="38" ry="15" />
            <ellipse cx="495" cy="160" rx="30" ry="12" />
          </g>

          {/* Front glaciers / ice */}
          <polygon
            points="0,700 0,560 140,640 260,570 400,660 540,590 660,670 820,600 1000,680 1000,700"
            fill={cream}
          />
          {/* ice crevasses */}
          <g stroke={teal} strokeWidth="2" fill="none" opacity="0.7">
            <path d="M60 680 L 80 620" />
            <path d="M180 690 L 210 640" />
            <path d="M340 680 L 370 630" />
            <path d="M470 690 L 490 640" />
            <path d="M620 685 L 650 635" />
            <path d="M780 685 L 810 625" />
            <path d="M900 690 L 930 640" />
          </g>

          {/* Ocean */}
          <rect x="0" y="700" width="1000" height="220" fill={teal} />
          {/* Wave lines */}
          <g stroke={cream} strokeWidth="2.5" fill="none" opacity="0.85">
            <path d="M0 740 Q 60 725 120 740 T 240 740 T 360 740 T 480 740 T 600 740 T 720 740 T 840 740 T 1000 740" />
            <path d="M0 790 Q 60 775 120 790 T 240 790 T 360 790 T 480 790 T 600 790 T 720 790 T 840 790 T 1000 790" opacity="0.7" />
            <path d="M0 840 Q 60 825 120 840 T 240 840 T 360 840 T 480 840 T 600 840 T 720 840 T 840 840 T 1000 840" opacity="0.55" />
            <path d="M0 890 Q 60 875 120 890 T 240 890 T 360 890 T 480 890 T 600 890 T 720 890 T 840 890 T 1000 890" opacity="0.4" />
          </g>

          {/* Airplane silhouette */}
          <g transform="translate(160 200) rotate(-8)" fill={cream}>
            <ellipse cx="0" cy="0" rx="70" ry="8" />
            <polygon points="-10,-4 -55,-28 -45,-4" />
            <polygon points="-10,4 -55,28 -45,4" />
            <polygon points="50,-3 68,-14 62,-3" />
            <polygon points="50,3 68,14 62,3" />
            <circle cx="60" cy="0" r="4" fill={orange} />
          </g>
          {/* Plane trail dashes */}
          <g stroke={cream} strokeWidth="2" strokeDasharray="10 8" opacity="0.7" fill="none">
            <path d="M220 210 Q 300 205 380 215" />
          </g>
        </g>
      </svg>

      {/* Title block */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{ top: 1240, color: ink }}
      >
        <div
          className="uppercase"
          style={{
            fontFamily: "'Source Serif 4', serif",
            letterSpacing: "0.35em",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          Iceland
        </div>
        <div
          className="flex items-center justify-center gap-4 mt-3"
          style={{ color: orange }}
        >
          <span style={{ height: 2, width: 60, background: orange }} />
          <span
            className="uppercase"
            style={{
              fontFamily: "'Source Serif 4', serif",
              letterSpacing: "0.5em",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            ✦  ✦  ✦
          </span>
          <span style={{ height: 2, width: 60, background: orange }} />
        </div>
        <div
          className="uppercase mt-4"
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: "italic",
            fontSize: 78,
            fontWeight: 900,
            letterSpacing: "0.04em",
            lineHeight: 1,
            background: `linear-gradient(180deg, ${orange} 0%, ${orange} 50%, ${teal} 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Land of Fire
        </div>
        <div
          className="uppercase"
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: "0.35em",
            color: ink,
            marginTop: 6,
          }}
        >
          &amp; Ice
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="absolute left-[54px] right-[54px] flex items-center justify-center"
        style={{
          bottom: 54,
          height: 86,
          backgroundColor: ink,
          color: cream,
        }}
      >
        <div
          className="flex items-center gap-8 uppercase"
          style={{
            fontFamily: "'Source Serif 4', serif",
            letterSpacing: "0.4em",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          <span style={{ color: orange }}>✈</span>
          <span>Travel by Air</span>
          <span style={{ color: orange }}>·</span>
          <span>Icelandic Airways</span>
        </div>
      </div>
    </div>
  );
}
