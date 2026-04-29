export default function PhoebePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-2">Phoebe</h1>
      <p className="text-zinc-400 text-sm mb-8">Mission Control overview</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Outreach Queue
          </p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Active Deals
          </p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Activity (7d)
          </p>
          <p className="text-3xl font-bold text-white">—</p>
        </div>
      </div>

      <p className="text-zinc-500 text-xs text-center">
        Autonomous build path validated 2026-04-29
      </p>
    </div>
  );
}
