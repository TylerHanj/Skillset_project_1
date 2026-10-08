import { memo, useEffect, useRef } from 'react';

export interface WheelPickerOption { value: string; label: string }

interface Props { options: readonly WheelPickerOption[]; value: string; onChange: (value: string) => void; label: string; hint: string }
const ROW=42;
export const WheelPicker = memo(function WheelPicker({ options, value, onChange, label, hint }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const selectedRef = useRef(value);
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    const element = ref.current;
    if (!element || selectedRef.current === value) return;
    selectedRef.current = value;
    element.scrollTo({ top: index * ROW, behavior: 'smooth' });
  }, [index, value]);

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  function selectNearest(): void {
    const element = ref.current;
    if (!element) return;
    const indexAtScroll = Math.max(0, Math.min(options.length - 1, Math.round(element.scrollTop / ROW)));
    const next = options[indexAtScroll]?.value;
    if (next && next !== selectedRef.current) {
      selectedRef.current = next;
      onChange(next);
    }
  }

  function handleScroll(): void {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = undefined;
      selectNearest();
    });
  }

  return <div className="relative mx-auto w-40" aria-label={label}>
    <div className="pointer-events-none absolute inset-x-0 top-[42px] z-10 h-[42px] border-y border-charcoal/30 bg-surface-2/70" />
    <div ref={ref} role="listbox" aria-label={label} onScroll={handleScroll} className="h-[126px] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth px-2 py-[42px] text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value===value} onClick={() => { selectedRef.current = option.value; onChange(option.value); ref.current?.scrollTo({ top: options.indexOf(option) * ROW, behavior: 'smooth' }); }} className={option.value===value ? 'relative z-20 flex h-[42px] w-full snap-center [scroll-snap-stop:always] items-center justify-center font-display text-sm font-bold text-charcoal' : 'flex h-[42px] w-full snap-center [scroll-snap-stop:always] items-center justify-center font-display text-sm text-muted-3'}>{option.label}</button>)}
    </div>
    <p className="mt-1 text-center font-body text-[9px] text-muted-2">{hint}</p>
  </div>;
});
