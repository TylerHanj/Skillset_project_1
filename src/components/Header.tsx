interface HeaderProps {
  overline: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}

export function Header({ overline, title, subtitle, trailing }: HeaderProps) {
  return (
    <header className="shrink-0 border-b border-ui">
      <div className="accent-bar" />
      <div className="flex items-end justify-between px-6 pb-[18px] pt-5">
        <div>
          <p className="type-overline mb-1">{overline}</p>
          <h1 className="font-display text-2xl font-bold tracking-tightest text-charcoal">{title}</h1>
          {subtitle ? (
            <p className="mt-[3px] font-body text-[11px] text-[#888888]">{subtitle}</p>
          ) : null}
        </div>
        {trailing}
      </div>
    </header>
  );
}
