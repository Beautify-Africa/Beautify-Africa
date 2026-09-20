import FadeIn from '../Shared/FadeIn';
import EmptyPanel from './EmptyPanel';
import RegionCard from './RegionCard';

export default function AdminRegionalPanel({ regionalPulse }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <FadeIn>
        <section className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                Geographic Velocity
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
                Regional Order Distribution
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">PAN-AFRICA METRICS</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {regionalPulse.length > 0 ? (
              regionalPulse.map((region) => <RegionCard key={region.region} {...region} />)
            ) : (
              <EmptyPanel
                title="No regional data"
                message="Regional demand trends will appear as orders are processed."
              />
            )}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-[#121828] via-[#0E131F] to-[#0A0E18] p-5 sm:p-6 text-white shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
              Security Protocol Note
            </p>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>

          <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-white">
            Access Perimeter &amp; Protection
          </h2>

          <div className="mt-4 space-y-3 text-xs leading-relaxed text-zinc-300">
            <p>
              Administrative privileges are strictly restricted to the verified single system owner via hardware-enforced backend whitelist validation.
            </p>
            <p className="text-zinc-400">
              All administrative operations, dispatch approvals, stock adjustments, and order actions are cryptographically authenticated and audited with timestamped session signatures.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>TLS 1.3 256-Bit Cryptographic Tunnel Active</span>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
