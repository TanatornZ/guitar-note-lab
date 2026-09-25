export function AppHeader() {
  return <>
    <header className="flex items-center justify-between gap-5">
      <div className="flex items-center gap-3 text-xl font-extrabold tracking-[-0.04em]"><span className="grid size-[38px] place-items-center rounded-xl bg-gradient-to-br from-[#f2ae49] to-[#f8755e] text-[#14203a]">♬</span>Chord Canvas</div>
      <span className="hidden text-sm text-[#aeb9d2] sm:block">Click a fret to hear and select its note</span>
    </header>
    <section className="mb-[22px] mt-8 flex flex-col gap-4 md:mt-0 md:flex-row md:items-end md:justify-between md:gap-5">
      <h1 className="max-w-[690px] text-[clamp(2rem,4.2vw,4.2rem)] leading-[1.03] font-extrabold tracking-[-0.065em]">Find the harmony inside <em className="not-italic text-[#f2ae49]">your notes.</em></h1>
      <p className="max-w-[315px] text-sm leading-relaxed text-[#aeb9d2]">Choose notes from the neck or the note row. We’ll surface chords that can contain them.</p>
    </section>
  </>
}
