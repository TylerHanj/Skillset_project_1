import type { Kpi } from '../types';

interface KpiCardProps {
  kpi: Kpi;
}

export function KpiCard({ kpi }: KpiCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-sm px-3.5 py-4 ${
        kpi.accent ? 'border border-charcoal bg-charcoal' : 'card-minimal'
      }`}
    >
      {kpi.accent ? <span className="absolute left-0 top-0 h-[3px] w-full bg-accent-red" /> : null}
      <p
        className={`mb-2 font-display text-[9px] font-semibold tracking-wider ${
          kpi.accent ? 'text-[#888888]' : 'text-muted-2'
        }`}
      >
        {kpi.label.toUpperCase()}
      </p>
      <p
        className={`mb-1.5 font-display text-[28px] font-bold leading-none tracking-tightest ${
          kpi.accent ? 'text-white' : 'text-charcoal'
        }`}
      >
        {kpi.value}
      </p>
      <p className={`font-body text-[10px] leading-[1.4] ${kpi.accent ? 'text-slate' : 'text-muted-3'}`}>
        {kpi.sub}
      </p>
    </article>
  );
}
