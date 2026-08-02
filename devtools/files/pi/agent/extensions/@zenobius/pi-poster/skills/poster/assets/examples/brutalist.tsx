export default function Brutalist() {
  return (
    <div className="w-[1200px] bg-[#fef08a] p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="border-[6px] border-black bg-white">
        {/* header strip */}
        <div className="flex items-center justify-between border-b-[6px] border-black bg-black px-6 py-3 text-white">
          <span className="text-[14px] font-black uppercase tracking-[0.3em]">No. 14 / Spring</span>
          <span className="text-[14px] font-black uppercase tracking-[0.3em]">Est. 2019</span>
        </div>
        {/* giant title */}
        <div className="border-b-[6px] border-black px-6 pt-4 pb-2">
          <h1 className="text-[260px] font-black leading-[0.78] tracking-[-0.06em]">STOP<br/>MAKING<br/>SENSE.</h1>
        </div>
        {/* dek + columns */}
        <div className="grid grid-cols-12 border-b-[6px] border-black">
          <div className="col-span-4 border-r-[6px] border-black bg-[#fb7185] p-6">
            <div className="text-[14px] font-black uppercase tracking-[0.25em]">Feature</div>
            <div className="mt-2 text-3xl font-black leading-[0.95]">The most honest design is the one that refuses to flatter.</div>
          </div>
          <div className="col-span-5 border-r-[6px] border-black p-6 text-[14px] leading-relaxed">
            <p className="first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none">Brutalism is not aggression. It is candor. Concrete does not apologize for being concrete, and a button does not apologize for being a button. We are tired of interfaces that beg to be liked.</p>
            <p className="mt-3">The ornament is the lie. Strip it. What remains is the work.</p>
          </div>
          <div className="col-span-3 flex flex-col items-center justify-center bg-black p-6 text-center text-white">
            <div className="text-[14px] font-black uppercase tracking-[0.3em]">Page</div>
            <div className="mt-1 text-[140px] font-black leading-none tabular-nums">42</div>
            <div className="text-[14px] uppercase tracking-[0.3em] text-white/60">of 96</div>
          </div>
        </div>
        {/* metric row */}
        <div className="grid grid-cols-4">
          {[
            ["100%", "Honest"],
            ["0%", "Decoration"],
            ["∞", "Durability"],
            ["1", "Weight — heavy"],
          ].map(([v, l], i) => (
            <div key={i} className={`border-r-[6px] border-black p-5 ${i === 3 ? "border-r-0" : ""}`}>
              <div className="text-6xl font-black tabular-nums">{v}</div>
              <div className="mt-1 text-[14px] font-black uppercase tracking-[0.25em]">{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* footer */}
      <div className="mt-6 flex items-center justify-between border-[6px] border-black bg-white px-6 py-3 text-[14px] font-black uppercase tracking-[0.3em]">
        <span>■ Volume One</span>
        <span>Printed in black</span>
        <span>No.01 · Spring</span>
      </div>
    </div>
  );
}
