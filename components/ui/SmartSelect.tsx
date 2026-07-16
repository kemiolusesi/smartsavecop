'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface SmartSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  buttonClassName?: string;
}

export default function SmartSelect({
  value,
  options,
  onChange,
  label,
  className = '',
  buttonClassName = '',
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-ghost px-4 text-left text-sm font-semibold text-brand-ink outline-none transition hover:border-[#D4AF37]/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white ${buttonClassName}`}
      >
        <span className="min-w-0 truncate">{value}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#D4AF37] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-brand-border bg-[#F8F6F1] p-1 shadow-2xl shadow-zinc-900/15 dark:border-white/10 dark:bg-[#141414] dark:shadow-black/40"
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? 'bg-[#D4AF37]/15 font-black text-[#B48924] dark:text-[#D4AF37]'
                    : 'font-semibold text-zinc-700 hover:bg-[#D4AF37]/10 dark:text-white/70 dark:hover:bg-[#D4AF37]/10'
                }`}
              >
                <span>{option}</span>
                {selected && <Check size={15} className="shrink-0 text-[#D4AF37]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
