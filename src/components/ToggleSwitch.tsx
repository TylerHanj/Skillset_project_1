interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  accent?: 'red' | 'ink';
}

export function ToggleSwitch({ checked, onChange, label, accent = 'ink' }: ToggleSwitchProps) {
  const onColor = accent === 'red' ? 'bg-accent-red' : 'bg-blue-ink';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-[42px] rounded-sm transition-colors duration-fast ${
        checked ? onColor : 'bg-border-ui'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-hair bg-white transition-[left] duration-fast ${
          checked ? 'left-5' : 'left-[3px]'
        }`}
      />
    </button>
  );
}
